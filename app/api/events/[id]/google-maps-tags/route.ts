import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/events/[id]/google-maps-tags
 * Récupère les tags Google Maps les plus votés pour un événement
 * Retourne un objet avec les tags pondérés agrégés de tous les utilisateurs
 */
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

    // Trier les tags par poids décroissant et retourner les plus importants
    const sortedTags = Object.entries(aggregatedTags)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag);

    return NextResponse.json(
      {
        tags: sortedTags,
        weights: aggregatedTags,
        totalVotes: preferences.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des tags Google Maps:', error);
    return NextResponse.json(
      {
        message: 'Erreur serveur interne',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
