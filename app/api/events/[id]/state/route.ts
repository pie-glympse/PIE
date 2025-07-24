import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventIdStr = resolvedParams.id;

    if (!eventIdStr) {
      return NextResponse.json(
        { message: "Paramètre eventId manquant dans l'URL" },
        { status: 400 }
      );
    }

    const eventId = BigInt(eventIdStr);
    const { state: newState } = await request.json();

    // Vérifier que l'état fourni est valide
    const validStates = ['pending', 'confirmed', 'planned'];
    if (!newState || !validStates.includes(newState.toLowerCase())) {
      return NextResponse.json(
        { message: 'État invalide. États autorisés: pending, confirmed, planned' },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe
    const currentEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { state: true }
    });

    if (!currentEvent) {
      return NextResponse.json(
        { message: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour l'événement avec le nouvel état
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { state: newState },
      select: {
        id: true,
        title: true,
        state: true
      }
    });

    return NextResponse.json(safeJson(updatedEvent), { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du state:', error);
    return NextResponse.json(
      { 
        message: 'Erreur serveur interne',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}