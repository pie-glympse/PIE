import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Cette route crée des notifications de feedback pour tous les participants d'un événement
 * Elle devrait être appelée automatiquement quand un événement se termine
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const eventId = BigInt(resolvedParams.id);

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    let notificationsCreated = 0;

    // Pour chaque utilisateur invité, créer une notification de feedback
    for (const user of event.users) {
      // Vérifier si une notification de feedback a déjà été créée
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

    return NextResponse.json(
      {
        message: "Notifications de feedback créées avec succès",
        notificationsCreated,
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
