import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const eventIdParam = resolvedParams.id;
    const body = await request.json();
    const { userId } = body;

    if (!eventIdParam || !userId) {
      return NextResponse.json({ error: "eventId et userId sont requis" }, { status: 400 });
    }

    const eventId = BigInt(eventIdParam);
    const userIdBigInt = BigInt(userId);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        createdById: true,
        users: {
          select: { id: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    if (event.createdById === userIdBigInt) {
      return NextResponse.json({ error: "Le créateur ne peut pas quitter son propre événement" }, { status: 400 });
    }

    const isParticipant = event.users.some((participant) => participant.id === userIdBigInt);

    if (!isParticipant) {
      return NextResponse.json({ error: "Vous ne participez pas à cet événement" }, { status: 403 });
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        users: {
          disconnect: { id: userIdBigInt },
        },
      },
    });

    return NextResponse.json(
      safeJson({
        success: true,
        eventId: eventIdParam,
        userId,
      })
    );
  } catch (error) {
    console.error("Erreur lors du départ de l'événement:", error);
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
