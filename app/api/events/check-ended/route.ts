import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailTemplate } from "@/lib/brevo";

/**
 * Cette route vérifie les événements terminés et crée des notifications de feedback
 * Elle peut être appelée manuellement ou via un cron job moins fréquent (ex: toutes les heures)
 */
export async function POST(request: NextRequest) {
  // Vérifier l'auth si nécessaire
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const allEvents = await prisma.event.findMany({
      where: { state: { not: "CANCELLED" } },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    const isDev = process.env.NODE_ENV === "development";
    let notificationsCreated = 0;

    for (const event of allEvents) {
      let eventEndDate: Date | null = null;

      if (event.endDate) {
        eventEndDate = new Date(event.endDate);
      } else if (event.endTime) {
        eventEndDate = new Date(event.endTime);
      } else if (event.startDate && event.duration) {
        eventEndDate = new Date(event.startDate);
        eventEndDate.setMinutes(eventEndDate.getMinutes() + event.duration);
      } else if (event.startDate) {
        eventEndDate = new Date(event.startDate);
        eventEndDate.setHours(23, 59, 59, 999);
      }

      if (!eventEndDate) continue;

      // Événement terminé depuis J+1 (entre 1 et 2 jours)
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const isJ1 = eventEndDate >= twoDaysAgo && eventEndDate < oneDayAgo;

      if (eventEndDate < now) {
        for (const user of event.users) {
          const existingNotification = await prisma.notification.findFirst({
            where: { userId: user.id, eventId: event.id, type: "FEEDBACK_REQUEST" },
          });
          const existingFeedback = await prisma.feedback.findUnique({
            where: { userId_eventId: { userId: user.id, eventId: event.id } },
          });

          if (!existingNotification && !existingFeedback) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                message: `Donnez votre avis sur l'événement "${event.title}"`,
                type: "FEEDBACK_REQUEST",
                eventId: event.id,
              },
            });

            // Envoyer le mail feedback uniquement à J+1
            if (isJ1) {
              const recipient = isDev ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com" : user.email;
              sendEmailTemplate({
                to: [{ email: recipient, name: `${user.firstName} ${user.lastName}` }],
                templateId: Number(process.env.BREVO_TEMPLATE_ID_FEEDBACK),
                params: { FIRSTNAME: user.firstName, EVENT_TITLE: event.title },
              }).catch((err) => console.error("Erreur mail feedback:", err));
            }

            notificationsCreated++;
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: "Vérification des événements terminée",
        notificationsCreated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la vérification des événements:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

