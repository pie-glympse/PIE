import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const eventId = url.searchParams.get('eventId');

    if (!userId) {
      return NextResponse.json(
        { message: 'userId est requis' },
        { status: 400 }
      );
    }

    if (eventId) {
      // Recherche d'une préférence pour un user + event précis
      const preference = await prisma.eventUserPreference.findUnique({
        where: {
          userId_eventId: {
            userId: BigInt(userId),
            eventId: BigInt(eventId),
          },
        },
        include: {
          tag: true,
        },
      });

      if (!preference) {
        return NextResponse.json(
          { message: 'Aucune préférence trouvée pour cet utilisateur et cet événement' },
          { status: 404 }
        );
      }

      return NextResponse.json(preference, { status: 200 });
    } else {
      // Recherche de toutes les préférences pour un user
      const preferences = await prisma.eventUserPreference.findMany({
        where: {
          userId: BigInt(userId),
        },
        include: {
          tag: true,
          event: true,
        },
      });

      return NextResponse.json(preferences, { status: 200 });
    }
  } catch (error) {
    console.error('Erreur récupération préférence :', error);
    return NextResponse.json(
      { message: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
