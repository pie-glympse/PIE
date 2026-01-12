import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const eventIdParam = resolvedParams.id;
    const { userId } = await request.json();

    if (!eventIdParam || !userId) {
      return NextResponse.json({ error: "eventId et userId sont requis" }, { status: 400 });
    }

    const eventId = BigInt(eventIdParam);
    const userIdBigInt = BigInt(userId);

    // Vérifier que l'événement existe et récupérer le créateur
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

    // Vérifier que l'utilisateur n'est pas le créateur
    if (event.createdById === userIdBigInt) {
      return NextResponse.json({ error: "Le créateur ne peut pas quitter son propre événement" }, { status: 400 });
    }

    // Vérifier que l'utilisateur est bien participant
    const isParticipant = event.users.some((participant) => participant.id === userIdBigInt);

    if (!isParticipant) {
      return NextResponse.json({ error: "Vous ne participez pas à cet événement" }, { status: 403 });
    }

    // Retirer l'utilisateur de l'événement
    await prisma.event.update({
      where: { id: eventId },
      data: {
        users: {
          disconnect: { id: userIdBigInt },
        },
      },
    });

    return NextResponse.json(
      { message: "Vous avez quitté l'événement avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la sortie de l'événement:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

