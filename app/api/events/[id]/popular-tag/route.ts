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

export async function GET(
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

    console.log('Recherche du tag populaire pour l\'événement:', eventIdStr);

    const eventId = BigInt(eventIdStr);

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      console.log('Événement non trouvé avec ID:', eventId);
      return NextResponse.json({ popularTag: null }, { status: 200 });
    }

    // Récupérer tous les tags sélectionnés pour cet événement avec leur nombre d'occurrences
    const tagStats = await prisma.eventUserPreference.groupBy({
      by: ['tagId'],
      where: {
        eventId: eventId,
      },
      _count: {
        tagId: true,
      },
      orderBy: {
        _count: {
          tagId: 'desc',
        },
      },
      take: 1, // Prendre seulement le plus populaire
    });

    console.log('Statistiques des tags:', tagStats);

    if (tagStats.length === 0) {
      console.log('Aucune préférence trouvée pour cet événement');
      return NextResponse.json({ popularTag: null }, { status: 200 });
    }

    // Récupérer les détails du tag le plus populaire
    const tagDetails = await prisma.tag.findUnique({
      where: {
        id: tagStats[0].tagId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log('Détails du tag populaire:', tagDetails);

    const result = {
      popularTag: tagDetails ? {
        ...tagDetails,
        count: tagStats[0]._count.tagId,
      } : null,
    };

    console.log('Résultat final:', result);

    return NextResponse.json(safeJson(result), { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération du tag populaire:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
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
