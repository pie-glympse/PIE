import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // ✅ Si on passe à "confirmed", finaliser l'événement avec les votes
    if (newState.toLowerCase() === 'confirmed') {
      // Récupérer toutes les préférences avec leurs tags Google Maps
      const preferences = await prisma.eventUserPreference.findMany({
        where: { eventId: eventId },
        select: {
          googleMapsTags: true,
        },
      });

      // Agréger les tags Google Maps de tous les utilisateurs
      const aggregatedTags: Record<string, number> = {};
      preferences.forEach((pref) => {
        if (pref.googleMapsTags && typeof pref.googleMapsTags === 'object') {
          const tags = pref.googleMapsTags as Record<string, number>;
          Object.entries(tags).forEach(([tag, weight]) => {
            aggregatedTags[tag] = (aggregatedTags[tag] || 0) + weight;
          });
        }
      });

      // Trier les tags par poids décroissant et prendre les plus importants
      const sortedTags = Object.entries(aggregatedTags)
        .sort(([, a], [, b]) => b - a)
        .map(([tag]) => tag);


      // Récupérer le tag le plus voté (ancien système) - seulement si tagId n'est pas null
      const mostVotedTag = await prisma.eventUserPreference.groupBy({
        by: ['tagId'],
        where: { 
          eventId: eventId,
          tagId: { not: null } // Seulement les préférences avec tagId (ancien format)
        },
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
        state: newState,
      };

      // ✅ Stocker les tags Google Maps les plus votés (même si vide, pour indiquer qu'on a traité)
      updateData.confirmedGoogleMapsTags = sortedTags;

      // ✅ Si on a une date gagnante, l'utiliser comme nouvelle date de début
      if (mostVotedDate.length > 0) {
        updateData.startDate = mostVotedDate[0].preferredDate;
      }

      // ✅ Utiliser une transaction pour lier le tag gagnant à l'événement
      const updatedEvent = await prisma.$transaction(async (tx) => {
        // Mettre à jour l'événement avec la nouvelle date et l'état
        const event = await tx.event.update({
          where: { id: eventId },
          data: updateData,
          select: {
            id: true,
            title: true,
            state: true,
            activityType: true, // Garder l'activityType original
            startDate: true,
            confirmedGoogleMapsTags: true,
          }
        });

        // ✅ Si on a un tag gagnant (ancien système), le lier à l'événement
        if (mostVotedTag.length > 0 && mostVotedTag[0].tagId) {
          // D'abord, supprimer tous les tags existants pour cet événement
          await tx.event.update({
            where: { id: eventId },
            data: {
              tags: {
                set: [] // Vider les tags existants
              }
            }
          });

          // Puis connecter le tag gagnant
          await tx.event.update({
            where: { id: eventId },
            data: {
              tags: {
                connect: { id: mostVotedTag[0].tagId }
              }
            }
          });
        }

        return event;
      });

      return NextResponse.json(safeJson(updatedEvent), { status: 200 });
    } else {
      // ✅ Pour les autres états, mise à jour simple
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
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du state:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    
    // Afficher plus de détails sur l'erreur Prisma
    type PrismaError = Error & { code?: string; meta?: unknown };
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const prismaError = error as PrismaError;
      console.error('Code Prisma:', prismaError.code);
      console.error('Meta Prisma:', JSON.stringify(prismaError.meta, null, 2));
    }
    
    return NextResponse.json(
      { 
        message: 'Erreur serveur interne',
        error: error instanceof Error ? error.message : String(error),
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}