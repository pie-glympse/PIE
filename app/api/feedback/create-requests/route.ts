import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)));
}

/**
 * Cette route crée des notifications de feedback pour les événements passés
 * Elle doit être appelée quotidiennement (via un cron job ou un scheduler)
 * Elle crée des notifications pour les événements qui se sont terminés hier
 */
export async function POST(request: NextRequest) {
  // Vérifier que la requête vient de Vercel Cron (sécurité)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const now = new Date();

    // Calculer la date d'hier à 8h du matin (pour les événements qui se sont terminés hier soir)
    const yesterdayMorning = new Date(now);
    yesterdayMorning.setDate(yesterdayMorning.getDate() - 1);
    yesterdayMorning.setHours(8, 0, 0, 0);

    // Calculer la date d'aujourd'hui à 8h du matin
    const todayMorning = new Date(now);
    todayMorning.setHours(8, 0, 0, 0);

    // Récupérer tous les événements qui ont des participants et qui ne sont pas annulés
    const allEvents = await prisma.event.findMany({
      where: {
        state: {
          not: "CANCELLED",
        },
      },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    let notificationsCreated = 0;

    for (const event of allEvents) {
      // Calculer la date de fin réelle de l'événement
      let eventEndDate: Date | null = null;

      if (event.endDate) {
        eventEndDate = new Date(event.endDate);
      } else if (event.endTime) {
        eventEndDate = new Date(event.endTime);
      } else if (event.startDate && event.duration) {
        // Si pas de endDate/endTime, utiliser startDate + duration (en minutes)
        eventEndDate = new Date(event.startDate);
        eventEndDate.setMinutes(eventEndDate.getMinutes() + event.duration);
      } else if (event.startDate) {
        // Si on n'a que startDate, considérer que l'événement se termine le même jour à minuit
        eventEndDate = new Date(event.startDate);
        eventEndDate.setHours(23, 59, 59, 999);
      }

      // Si on ne peut pas déterminer la date de fin, passer à l'événement suivant
      if (!eventEndDate) {
        continue;
      }

      // Vérifier si l'événement s'est terminé hier (avant aujourd'hui 8h)
      // Si l'événement s'est terminé avant aujourd'hui 8h, créer les notifications
      // On vérifie aussi qu'on n'a pas déjà créé de notification pour cet événement
      if (eventEndDate < todayMorning) {
        // Pour chaque utilisateur invité, créer une notification de feedback
        for (const user of event.users) {
          // Vérifier si une notification de feedback a déjà été créée pour cet utilisateur et cet événement
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              eventId: event.id,
              type: "FEEDBACK_REQUEST",
            },
          });

          // Vérifier si l'utilisateur a déjà soumis un feedback
          const existingFeedback = await prisma.feedback.findUnique({
            where: {
              userId_eventId: {
                userId: user.id,
                eventId: event.id,
              },
            },
          });

          // Ne créer la notification que si elle n'existe pas déjà et si l'utilisateur n'a pas encore donné de feedback
          if (!existingNotification && !existingFeedback) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                message: `Donnez votre avis sur l'événement "${event.title}"`,
                type: "FEEDBACK_REQUEST",
                eventId: event.id,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    return NextResponse.json(
      {
        message: "Notifications de feedback créées avec succès",
        notificationsCreated,
        eventsProcessed: allEvents.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la création des notifications de feedback:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
