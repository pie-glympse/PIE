import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailTemplate } from "@/lib/brevo";

// Appelée par un cron J+3 après la création d'un événement
// Envoie un rappel aux participants qui n'ont pas rempli leur questionnaire
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date(now);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    // Événements créés il y a ~3 jours, encore en état pending
    const events = await prisma.event.findMany({
      where: {
        state: "pending",
        createdAt: { gte: fourDaysAgo, lte: threeDaysAgo },
      },
      include: {
        users: { select: { id: true, email: true, firstName: true, lastName: true } },
        preferences: { select: { userId: true } },
      },
    });

    const isDev = process.env.NODE_ENV === "development";
    let emailsSent = 0;

    for (const event of events) {
      const usersWhoAnswered = new Set(event.preferences.map((p) => p.userId.toString()));

      for (const user of event.users) {
        if (usersWhoAnswered.has(user.id.toString())) continue;

        // Vérifier qu'on n'a pas déjà envoyé ce reminder
        const alreadySent = await prisma.notification.findFirst({
          where: { userId: user.id, eventId: event.id, type: "QUESTIONNAIRE_REMINDER" },
        });
        if (alreadySent) continue;

        const recipient = isDev ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com" : user.email;
        sendEmailTemplate({
          to: [{ email: recipient, name: `${user.firstName} ${user.lastName}` }],
          templateId: Number(process.env.BREVO_TEMPLATE_ID_QUESTIONNAIRE_REMINDER),
          params: { FIRSTNAME: user.firstName, EVENT_TITLE: event.title },
        }).catch((err) => console.error("Erreur mail reminder questionnaire:", err));

        await prisma.notification.create({
          data: {
            userId: user.id,
            eventId: event.id,
            type: "QUESTIONNAIRE_REMINDER",
            message: `Rappel : remplissez votre questionnaire pour "${event.title}"`,
          },
        });

        emailsSent++;
      }
    }

    return NextResponse.json({ message: "Rappels questionnaire envoyés", emailsSent });
  } catch (error) {
    console.error("Erreur reminder questionnaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
