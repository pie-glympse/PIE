import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const {
      title,
      startDate,
      endDate,
      startTime,
      endTime,
      maxPersons,
      costPerPerson,
      state,
      activityType,
      city,
      maxDistance,
      recurring,
      duration,
      recurringRate,
      tags,
      userId,
      invitedUsers = [], // Nouveaux utilisateurs invités
    } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    // Debug: vérifier si l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: BigInt(userId) }
    });

    if (!userExists) {
      return NextResponse.json({ 
        error: `L'utilisateur avec l'ID ${userId} n'existe pas en base de données` 
      }, { status: 404 });
    }

    // Debug: vérifier les utilisateurs invités
    if (invitedUsers && Array.isArray(invitedUsers) && invitedUsers.length > 0) {
      const existingUsers = await prisma.user.findMany({
        where: {
          id: { in: invitedUsers.map((id: number) => BigInt(id)) }
        }
      });
      
      if (existingUsers.length !== invitedUsers.length) {
        const missingUsers = invitedUsers.filter(userId => 
          !existingUsers.some(existingUser => existingUser.id === BigInt(userId))
        );
        return NextResponse.json({ 
          error: `Utilisateurs manquants avec les IDs: ${missingUsers.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Debug: si des tags sont fournis, vérifier lesquels existent
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: {
          id: { in: tags.map((id: number) => BigInt(id)) }
        }
      });
      
      if (existingTags.length !== tags.length) {
        const missingTags = tags.filter(tagId => 
          !existingTags.some(existingTag => existingTag.id === BigInt(tagId))
        );
        return NextResponse.json({ 
          error: `Tags manquants avec les IDs: ${missingTags.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Helper pour créer une date sans heure (seulement la date)
    const createDateOnly = (dateString: string) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      // Créer une date à minuit UTC pour éviter les problèmes de timezone
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    };

    // Helper pour créer une heure uniquement (sur une date de référence)
    const createTimeOnly = (timeString: string) => {
      if (!timeString) return null;
      // Si c'est déjà un timestamp ISO, extraire juste l'heure
      if (timeString.includes('T')) {
        const timeOnly = timeString.split('T')[1].split('.')[0]; // Extraire HH:MM:SS
        return new Date(`1970-01-01T${timeOnly}`);
      }
      // Si c'est juste HH:MM, l'utiliser directement
      return new Date(`1970-01-01T${timeString}:00`);
    };

    const newEvent = await prisma.event.create({
      data: {
        title,
        startDate: createDateOnly(startDate),
        endDate: createDateOnly(endDate), 
        startTime: createTimeOnly(startTime),
        endTime: createTimeOnly(endTime),
        maxPersons: maxPersons ? BigInt(maxPersons) : null,
        costPerPerson: costPerPerson ? BigInt(costPerPerson) : null,
        state,
        activityType,
        city,
        maxDistance: maxDistance ? Number(maxDistance) : null,
        recurring: recurring || false,
        duration: duration ? Number(duration) : null,
        recurringRate: recurringRate || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: BigInt(userId), // ✅ Enregistrer le créateur
        users: {
          connect: [
            { id: BigInt(userId) }, // Le créateur de l'événement
            ...(invitedUsers && Array.isArray(invitedUsers) 
              ? invitedUsers.map((id: number) => ({ id: BigInt(id) }))
              : []
            )
          ],
        },
        ...(tags && Array.isArray(tags)
          ? {
              tags: {
                connect: tags.map((id: number) => ({ id: BigInt(id) })),
              },
            }
          : {}),
      },
      include: {
        tags: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
      },
    });

    // Créer une notification pour le créateur
    await prisma.notification.create({
      data: {
        userId: BigInt(userId),
        message: `Création de l'événement "${title}" réussie`,
        type: 'EVENT_CREATED',
        eventId: newEvent.id,
      },
    });

    // Créer des notifications pour les utilisateurs invités (sauf le créateur)
    if (invitedUsers && Array.isArray(invitedUsers) && invitedUsers.length > 0) {
      const creator = await prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      if (creator) {
        // Filtrer pour ne pas notifier le créateur
        const usersToNotify = invitedUsers.filter((invitedUserId: number) => invitedUserId !== Number(userId));

        if (usersToNotify.length > 0) {
          // Créer une notification pour chaque utilisateur invité
          await prisma.notification.createMany({
            data: usersToNotify.map((invitedUserId: number) => ({
              userId: BigInt(invitedUserId),
              message: `@${creator.firstName}${creator.lastName} vous a invité à son événement "${title}"`,
              type: 'EVENT_INVITATION',
              eventId: newEvent.id,
            })),
          });
        }
      }
    }

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(newEvent, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création event:", error);
    return NextResponse.json({ error: "Erreur création event" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const events = await prisma.event.findMany({
      where: {
        users: {
          some: {
            id: BigInt(userId)
          }
        }
      },
      include: {
        tags: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(events, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      )
    );
  } catch (error) {
    console.error("Erreur récupération events:", error);
    return NextResponse.json({ error: "Erreur récupération events" }, { status: 500 });
  }
}
