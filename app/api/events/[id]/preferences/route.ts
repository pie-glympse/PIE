import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // 🔥 Récupérer l'id depuis l'URL
    const url = new URL(request.url);
    // Correction: extraire l'id juste avant "preferences"
    const pathParts = url.pathname.split('/').filter(Boolean);
    const preferencesIndex = pathParts.indexOf('preferences');
    const id =
      preferencesIndex > 0 ? pathParts[preferencesIndex - 1] : undefined;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { message: 'Paramètre id manquant ou invalide dans l’URL' },
        { status: 400 }
      );
    }

    const eventId = BigInt(id);

    const { userId, tagId, preferredDate } = await request.json();

    if (!userId || !tagId || !preferredDate) {
      return NextResponse.json(
        { message: 'userId, tagId et preferredDate sont requis' },
        { status: 400 }
      );
    }

    const preference = await prisma.eventUserPreference.upsert({
      where: {
        userId_eventId: {
          userId: BigInt(userId),
          eventId: eventId,
        },
      },
      update: {
        preferredDate: new Date(preferredDate),
        tagId: BigInt(tagId),
      },
      create: {
        userId: BigInt(userId),
        eventId: eventId,
        tagId: BigInt(tagId),
        preferredDate: new Date(preferredDate),
      },
    });

    const serializablePreference = {
      ...preference,
      userId: preference.userId.toString(),
      eventId: preference.eventId.toString(),
      tagId: preference.tagId.toString(),
    };

    return NextResponse.json(
      {
        message: 'Préférence enregistrée avec succès',
        preference: serializablePreference,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de la préférence :', error);
    return NextResponse.json(
      { message: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
