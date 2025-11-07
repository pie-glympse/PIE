import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // ✅ Récupérer l'eventId depuis l'URL correctement
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    // segments = ["api", "events", "123", "preferences"]
    const eventIdStr = segments[2]; // Le 3ème segment est l'eventId

    if (!eventIdStr) {
      return NextResponse.json(
        { message: "Paramètre eventId manquant dans l'URL" },
        { status: 400 }
      );
    }

    const eventId = BigInt(eventIdStr);

    const { userId, tagId, preferredDate } = await request.json();

    if (!userId || !tagId || !preferredDate) {
      return NextResponse.json(
        { message: 'userId, tagId et preferredDate sont requis' },
        { status: 400 }
      );
    }

    // ✅ Convertir les IDs en BigInt avec validation
    const userIdBigInt = BigInt(userId);
    const tagIdBigInt = BigInt(tagId);

    // ✅ Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { message: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // ✅ Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userIdBigInt },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // ✅ Vérifier que le tag existe
    const tag = await prisma.tag.findUnique({
      where: { id: tagIdBigInt },
    });

    if (!tag) {
      return NextResponse.json(
        { message: 'Tag non trouvé' },
        { status: 404 }
      );
    }

    // ✅ Utiliser une transaction explicite pour s'assurer que les données sont bien sauvegardées
    const preference = await prisma.$transaction(async (tx) => {
      // Vérifier si une préférence existe déjà
      const existingPreference = await tx.eventUserPreference.findUnique({
        where: {
          userId_eventId: {
            userId: userIdBigInt,
            eventId: eventId,
          },
        },
      });

      let result;
      if (existingPreference) {
        result = await tx.eventUserPreference.update({
          where: {
            userId_eventId: {
              userId: userIdBigInt,
              eventId: eventId,
            },
          },
          data: {
            preferredDate: new Date(preferredDate),
            tagId: tagIdBigInt,
          },
        });
      } else {
        result = await tx.eventUserPreference.create({
          data: {
            userId: userIdBigInt,
            eventId: eventId,
            tagId: tagIdBigInt,
            preferredDate: new Date(preferredDate),
          },
        });
      }
      return result;
    });

    // ✅ Vérifier immédiatement que la préférence a bien été sauvegardée
    const verificationPreference = await prisma.eventUserPreference.findUnique({
      where: {
        userId_eventId: {
          userId: userIdBigInt,
          eventId: eventId,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tag: {
          select: {
            name: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!verificationPreference) {
      throw new Error('La préférence n\'a pas pu être sauvegardée en base de données');
    }

    // ✅ Vérifier aussi en comptant toutes les préférences pour cet utilisateur
    const userPreferencesCount = await prisma.eventUserPreference.count({
      where: {
        userId: userIdBigInt,
      },
    });

    const serializablePreference = {
      ...preference,
      userId: preference.userId.toString(),
      eventId: preference.eventId.toString(),
      tagId: preference.tagId.toString(),
    };

    // Créer une notification pour l'organisateur (premier utilisateur)
    const eventWithUsers = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (eventWithUsers && eventWithUsers.users.length > 0) {
      const organizerId = eventWithUsers.users[0].id;

      // Ne pas notifier si c'est l'organisateur lui-même qui répond
      if (organizerId.toString() !== userId.toString()) {
        await prisma.notification.create({
          data: {
            userId: organizerId,
            message: `@${user.firstName}${user.lastName} a répondu au questionnaire de "${event.title}"`,
            type: 'QUESTIONNAIRE_RESPONSE',
            eventId: eventId,
          },
        });
      }

      // Vérifier si tous les participants ont répondu au questionnaire
      const totalParticipants = eventWithUsers.users.length;
      const totalResponses = await prisma.eventUserPreference.count({
        where: {
          eventId: eventId,
        },
      });

      // Si tous les participants ont répondu, notifier l'organisateur
      if (totalResponses === totalParticipants) {
        await prisma.notification.create({
          data: {
            userId: organizerId,
            message: `Générer votre évènement "${event.title}", tous les participants ont répondu au questionnaire !`,
            type: 'EVENT_READY_TO_GENERATE',
            eventId: eventId,
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: 'Préférence enregistrée avec succès',
        preference: serializablePreference,
        verification: {
          saved: !!verificationPreference,
          userPreferencesCount,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur complète lors de la création de la préférence :', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    
    // ✅ Ajouter plus de détails sur l'erreur Prisma
    type PrismaError = Error & { code?: string; meta?: unknown };
    function isPrismaError(err: unknown): err is PrismaError {
      return typeof err === 'object' && err !== null && 'code' in err;
    }
    if (isPrismaError(error)) {
      console.error('Code d\'erreur Prisma:', error.code);
      console.error('Méta-données:', error.meta);
    }
    
    return NextResponse.json(
      { 
        message: 'Erreur serveur interne',
        error: error instanceof Error ? error.message : String(error),
        code: typeof error === 'object' && error !== null && 'code' in error ? (error as PrismaError).code : 'UNKNOWN',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
