import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateGoogleMapsTagsWeights } from '@/lib/preferences/questionsConfig';

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

    const body = await request.json();
    const { userId, tagId, preferredDate, answers, activityType } = body;

    // Vérifier que userId est présent
    if (!userId) {
      return NextResponse.json(
        { message: 'userId est requis' },
        { status: 400 }
      );
    }

    // Support pour l'ancien format (tagId + preferredDate) et le nouveau format (answers)
    const isNewFormat = answers && Array.isArray(answers);
    const isOldFormat = tagId && preferredDate;

    if (!isNewFormat && !isOldFormat) {
      return NextResponse.json(
        { message: 'Soit (tagId et preferredDate) soit (answers) sont requis' },
        { status: 400 }
      );
    }

    // ✅ Convertir les IDs en BigInt avec validation
    const userIdBigInt = BigInt(userId);

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

    // ✅ Utiliser une transaction explicite pour s'assurer que les données sont bien sauvegardées
    const preference = await prisma.$transaction(async (tx) => {
      let tagIdBigInt: bigint | undefined;
      let preferredDateValue: Date | undefined;
      let googleMapsTags: Record<string, number> | undefined;

      // Gérer l'ancien format
      if (isOldFormat) {
        tagIdBigInt = BigInt(tagId);
        preferredDateValue = new Date(preferredDate);
        
        // Vérifier que le tag existe
        const tag = await tx.tag.findUnique({
          where: { id: tagIdBigInt },
        });

        if (!tag) {
          throw new Error('Tag non trouvé');
        }
      }

      // Gérer le nouveau format
      if (isNewFormat) {
        // Calculer les tags Google Maps pondérés à partir des réponses
        try {
          googleMapsTags = calculateGoogleMapsTagsWeights(answers, activityType || event.activityType || undefined);
          
        } catch (error) {
          console.error('Erreur lors du calcul des tags Google Maps:', error);
          throw new Error(`Erreur lors du calcul des tags: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Pour le nouveau format, on utilise la date de début de l'événement comme preferredDate
        preferredDateValue = event.startDate || new Date();
        
        // Pour l'ancien système de tags, on peut utiliser le premier tag disponible ou null
        // (on garde tagId optionnel pour la compatibilité)
      }

      // Vérifier si une préférence existe déjà
      const existingPreference = await tx.eventUserPreference.findUnique({
        where: {
          userId_eventId: {
            userId: userIdBigInt,
            eventId: eventId,
          },
        },
        include: {
          answers: true,
        },
      });

      let result;
      const preferenceData: any = {
        userId: userIdBigInt,
        eventId: eventId,
        preferredDate: preferredDateValue,
      };

      if (tagIdBigInt) {
        preferenceData.tagId = tagIdBigInt;
      }

      if (googleMapsTags) {
        preferenceData.googleMapsTags = googleMapsTags;
      }

      // Créer ou mettre à jour la préférence d'abord
      if (existingPreference) {
        // Supprimer les anciennes réponses si elles existent
        if (existingPreference.answers.length > 0) {
          await tx.eventUserPreferenceAnswer.deleteMany({
            where: {
              userId: userIdBigInt,
              eventId: eventId,
            },
          });
        }

        result = await tx.eventUserPreference.update({
          where: {
            userId_eventId: {
              userId: userIdBigInt,
              eventId: eventId,
            },
          },
          data: preferenceData,
        });
      } else {
        result = await tx.eventUserPreference.create({
          data: preferenceData,
        });
      }

      // S'assurer que la préférence est bien créée avant de créer les réponses

      // Si nouveau format, créer les réponses aux questions
      if (isNewFormat && answers && Array.isArray(answers)) {
        for (const answer of answers) {
          if (!answer.questionId || !answer.answerIds || !Array.isArray(answer.answerIds)) {
            console.error('Format de réponse invalide:', answer);
            throw new Error(`Format de réponse invalide pour la question ${answer.questionId}`);
          }
          
          try {
            // Créer la réponse - Prisma établit automatiquement la relation via userId et eventId
            const answerData = await tx.eventUserPreferenceAnswer.create({
              data: {
                userId: userIdBigInt,
                eventId: eventId,
                questionId: answer.questionId,
                answerIds: answer.answerIds,
              },
            });
          } catch (error) {
            console.error(`Erreur lors de la création de la réponse pour ${answer.questionId}:`, error);
            // Afficher plus de détails sur l'erreur
            if (error instanceof Error) {
              console.error('Message d\'erreur:', error.message);
              console.error('Stack:', error.stack);
            }
            // Afficher les détails Prisma si disponibles
            type PrismaError = Error & { code?: string; meta?: unknown };
            if (typeof error === 'object' && error !== null && 'code' in error) {
              const prismaError = error as PrismaError;
              console.error('Code Prisma:', prismaError.code);
              console.error('Meta Prisma:', JSON.stringify(prismaError.meta, null, 2));
            }
            throw error;
          }
        }
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
        answers: {
          select: {
            questionId: true,
            answerIds: true,
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
      tagId: preference.tagId ? preference.tagId.toString() : null,
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
      console.error('Message:', error.message);
    }
    
    // ✅ Ajouter plus de détails sur l'erreur Prisma
    type PrismaError = Error & { code?: string; meta?: unknown; clientVersion?: string };
    function isPrismaError(err: unknown): err is PrismaError {
      return typeof err === 'object' && err !== null && 'code' in err;
    }
    if (isPrismaError(error)) {
      console.error('Code d\'erreur Prisma:', error.code);
      console.error('Méta-données:', JSON.stringify(error.meta, null, 2));
      console.error('Client version:', error.clientVersion);
    }
    
    // Retourner un message d'erreur plus détaillé en développement
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = isPrismaError(error) ? error.code : 'UNKNOWN';
    const errorDetails = isPrismaError(error) ? error.meta : undefined;
    
    return NextResponse.json(
      { 
        message: 'Erreur serveur interne',
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? {
          stack: error instanceof Error ? error.stack : undefined,
          prismaMeta: errorDetails,
        } : undefined
      },
      { status: 500 }
    );
  }
}
