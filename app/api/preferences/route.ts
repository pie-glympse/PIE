import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const eventId = url.searchParams.get('eventId');

    if (!userId || !eventId) {
      return NextResponse.json(
        { message: 'userId et eventId sont requis' },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error('Erreur récupération préférence :', error);
    return NextResponse.json(
      { message: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
