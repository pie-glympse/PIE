import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function POST(
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

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { message: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le tag le plus voté
    const mostVotedTag = await prisma.eventUserPreference.groupBy({
      by: ['tagId'],
      where: { eventId: eventId },
      _count: { tagId: true },
      orderBy: { _count: { tagId: 'desc' } },
      take: 1,
    });

    // Récupérer la date la plus votée
    const mostVotedDate = await prisma.eventUserPreference.groupBy({
      by: ['preferredDate'],
      where: { eventId: eventId },
      _count: { preferredDate: true },
      orderBy: { _count: { preferredDate: 'desc' } },
      take: 1,
    });

    const updateData: any = {
      state: 'confirmed',
    };

    // Si on a un tag gagnant, récupérer son nom et l'ajouter à l'activité
    if (mostVotedTag.length > 0) {
      const tagDetails = await prisma.tag.findUnique({
        where: { id: mostVotedTag[0].tagId },
        select: { name: true },
      });
      
      if (tagDetails) {
        updateData.activityType = tagDetails.name;
      }
    }

    // Si on a une date gagnante, l'utiliser comme nouvelle date de début
    if (mostVotedDate.length > 0) {
      updateData.startDate = mostVotedDate[0].preferredDate;
    }

    // Mettre à jour l'événement
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        tags: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Événement finalisé avec succès',
        event: safeJson(updatedEvent),
        results: {
          mostVotedActivity: mostVotedTag.length > 0 ? {
            count: mostVotedTag[0]._count.tagId,
            tagId: mostVotedTag[0].tagId.toString(),
          } : null,
          mostVotedDate: mostVotedDate.length > 0 ? {
            count: mostVotedDate[0]._count.preferredDate,
            date: mostVotedDate[0].preferredDate,
          } : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la finalisation de l\'événement:', error);
    return NextResponse.json(
      { 
        message: 'Erreur serveur interne',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
