import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

/**
 * POST - Soumettre un feedback pour un événement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventId, participated, rating, message } = body;

    if (!userId || !eventId || participated === undefined) {
      return NextResponse.json(
        { error: "userId, eventId et participated sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: BigInt(eventId) },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est invité à cet événement
    const userEvent = await prisma.event.findFirst({
      where: {
        id: BigInt(eventId),
        users: {
          some: {
            id: BigInt(userId),
          },
        },
      },
    });

    if (!userEvent) {
      return NextResponse.json(
        { error: "Vous n'êtes pas invité à cet événement" },
        { status: 403 }
      );
    }

    // Créer ou mettre à jour le feedback
    const feedback = await prisma.feedback.upsert({
      where: {
        userId_eventId: {
          userId: BigInt(userId),
          eventId: BigInt(eventId),
        },
      },
      update: {
        participated,
        rating: rating ? BigInt(rating) : null,
        message: message || null,
        createdAt: new Date(),
      },
      create: {
        userId: BigInt(userId),
        eventId: BigInt(eventId),
        participated,
        rating: rating ? BigInt(rating) : null,
        message: message || null,
        createdAt: new Date(),
      },
    });

    // Supprimer la notification de feedback après soumission
    // (pour ne plus afficher la popup)
    await prisma.notification.deleteMany({
      where: {
        userId: BigInt(userId),
        eventId: BigInt(eventId),
        type: "FEEDBACK_REQUEST",
      },
    });

    return NextResponse.json(safeJson(feedback), { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la soumission du feedback:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Récupérer les feedbacks d'un événement (pour les admins)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const userId = searchParams.get("userId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId est requis" },
        { status: 400 }
      );
    }

    const where: any = {
      eventId: BigInt(eventId),
    };

    if (userId) {
      where.userId = BigInt(userId);
    }

    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(safeJson(feedbacks), { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des feedbacks:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

