import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    
    // Récupérer tous les événements qui ont une date de fin passée
    // et qui ne sont pas annulés
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
        eventEndDate = new Date(event.startDate);
        eventEndDate.setMinutes(eventEndDate.getMinutes() + event.duration);
      } else if (event.startDate) {
        eventEndDate = new Date(event.startDate);
        eventEndDate.setHours(23, 59, 59, 999);
      }

      // Si on ne peut pas déterminer la date de fin, passer à l'événement suivant
      if (!eventEndDate) {
        continue;
      }

      // Si l'événement est terminé (date de fin passée)
      if (eventEndDate < now) {
        // Pour chaque utilisateur invité, créer une notification de feedback
        for (const user of event.users) {
          // Vérifier si une notification de feedback existe déjà
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

          // Créer la notification seulement si elle n'existe pas et qu'il n'y a pas de feedback
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

