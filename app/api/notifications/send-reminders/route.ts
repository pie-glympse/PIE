import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Calculer la date de demain (24h à partir de maintenant)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(tomorrow.getHours() + 24);

    // Calculer la date dans 48h (pour avoir une fenêtre de 24h)
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 48);

    // Récupérer tous les événements qui commencent dans les prochaines 24-48h
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: tomorrow,
          lte: dayAfterTomorrow,
        },
        state: {
          not: 'CANCELLED', // Ne pas envoyer de rappels pour les événements annulés
        },
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    let notificationsSent = 0;

    // Pour chaque événement, créer des notifications pour tous les participants
    for (const event of upcomingEvents) {
      // Vérifier si des notifications de rappel ont déjà été envoyées pour cet événement
      const existingReminders = await prisma.notification.findFirst({
        where: {
          eventId: event.id,
          type: 'EVENT_REMINDER',
        },
      });

      // Ne pas envoyer de rappel si un a déjà été envoyé
      if (existingReminders) {
        continue;
      }

      // Créer une notification pour chaque participant
      for (const user of event.users) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            message: `N'oubliez pas "${event.title}" à lieu demain !`,
            type: 'EVENT_REMINDER',
            eventId: event.id,
          },
        });
        notificationsSent++;
      }
    }

    return NextResponse.json({
      message: 'Rappels envoyés avec succès',
      eventsProcessed: upcomingEvents.length,
      notificationsSent,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi des rappels:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des rappels" },
      { status: 500 }
    );
  }
}

// GET endpoint pour tester/vérifier les événements à venir
export async function GET() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(tomorrow.getHours() + 24);

    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setHours(dayAfterTomorrow.getHours() + 48);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: tomorrow,
          lte: dayAfterTomorrow,
        },
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Événements à venir dans les prochaines 24h',
      events: upcomingEvents.map(event => ({
        id: event.id.toString(),
        title: event.title,
        startDate: event.startDate,
        participantsCount: event.users.length,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des événements" },
      { status: 500 }
    );
  }
}
