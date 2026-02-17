import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateETag,
  isNotModified,
  addCacheHeaders,
  CACHE_STRATEGIES,
} from "@/lib/cache-utils";

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
      placeName,
      placeAddress,
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
      where: { id: BigInt(userId) },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          error: `L'utilisateur avec l'ID ${userId} n'existe pas en base de données`,
        },
        { status: 404 },
      );
    }

    // Debug: vérifier les utilisateurs invités
    if (
      invitedUsers &&
      Array.isArray(invitedUsers) &&
      invitedUsers.length > 0
    ) {
      const existingUsers = await prisma.user.findMany({
        where: {
          id: { in: invitedUsers.map((id: number) => BigInt(id)) },
        },
      });

      if (existingUsers.length !== invitedUsers.length) {
        const missingUsers = invitedUsers.filter(
          (userId) =>
            !existingUsers.some(
              (existingUser) => existingUser.id === BigInt(userId),
            ),
        );
        return NextResponse.json(
          {
            error: `Utilisateurs manquants avec les IDs: ${missingUsers.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    // Debug: si des tags sont fournis, vérifier lesquels existent
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: {
          id: { in: tags.map((id: number) => BigInt(id)) },
        },
      });

      if (existingTags.length !== tags.length) {
        const missingTags = tags.filter(
          (tagId) =>
            !existingTags.some(
              (existingTag) => existingTag.id === BigInt(tagId),
            ),
        );
        return NextResponse.json(
          {
            error: `Tags manquants avec les IDs: ${missingTags.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    // Helper pour créer une date sans heure (seulement la date)
    const createDateOnly = (dateString: string) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      // Créer une date à minuit UTC pour éviter les problèmes de timezone
      return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
      );
    };

    // Helper pour créer une heure uniquement (sur une date de référence)
    const createTimeOnly = (timeString: string) => {
      if (!timeString) return null;
      // Si c'est déjà un timestamp ISO, extraire juste l'heure
      if (timeString.includes("T")) {
        const timeOnly = timeString.split("T")[1].split(".")[0]; // Extraire HH:MM:SS
        return new Date(`1970-01-01T${timeOnly}`);
      }
      // Si c'est juste HH:MM, l'utiliser directement
      return new Date(`1970-01-01T${timeString}:00`);
    };

    // Fonction pour extraire la ville depuis une adresse via Google Geocoding API
    const extractCityFromAddress = async (
      address: string,
    ): Promise<string | null> => {
      const apiKey =
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey || !address) {
        return null;
      }

      try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`,
        );

        if (!response.ok) {
          console.error("Erreur lors de l'appel à l'API Google Geocoding");
          return null;
        }

        const data = await response.json();

        if (data.status === "OK" && data.results && data.results.length > 0) {
          const result = data.results[0];

          // Chercher le composant "locality" (ville) dans les résultats
          const localityComponent = result.address_components?.find(
            (component: any) => component.types.includes("locality"),
          );

          if (localityComponent) {
            return localityComponent.long_name;
          }

          // Si pas de "locality", chercher "administrative_area_level_2" (arrondissement/département)
          const adminAreaLevel2 = result.address_components?.find(
            (component: any) =>
              component.types.includes("administrative_area_level_2"),
          );

          if (adminAreaLevel2) {
            return adminAreaLevel2.long_name;
          }

          // Si toujours rien, chercher "postal_town" (ville postale)
          const postalTown = result.address_components?.find((component: any) =>
            component.types.includes("postal_town"),
          );

          if (postalTown) {
            return postalTown.long_name;
          }
        }
      } catch (error) {
        console.error("Erreur lors de l'extraction de la ville:", error);
      }

      return null;
    };

    // Déterminer la valeur à stocker dans city
    let cityValue = city;

    // Pour les événements "Je sais ce que je veux faire", extraire la ville depuis l'adresse
    const isSpecificPlaceEvent = activityType === "Je sais ce que je veux";

    if (isSpecificPlaceEvent && placeAddress) {
      // Extraire la ville depuis l'adresse
      const extractedCity = await extractCityFromAddress(placeAddress);

      if (extractedCity) {
        cityValue = extractedCity;
      } else {
        // Si l'extraction échoue, utiliser l'adresse complète comme fallback
        if (placeName && placeAddress) {
          cityValue = `${placeName} - ${placeAddress}`;
        } else if (placeAddress) {
          cityValue = placeAddress;
        }
      }
    } else if (placeName && placeAddress) {
      // Pour les autres types d'événements, garder le comportement actuel
      cityValue = `${placeName} - ${placeAddress}`;
    } else if (placeName) {
      cityValue = placeName;
    } else if (placeAddress) {
      cityValue = placeAddress;
    }

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
        city: cityValue,
        maxDistance: maxDistance ? Number(maxDistance) : null,
        recurring: recurring || false,
        duration: duration ? Number(duration) : null,
        recurringRate: recurringRate || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: BigInt(userId), // ✅ Enregistrer le créateur
        users: {
          connect: [
            { id: BigInt(userId) }, // Seulement le créateur de l'événement
            // Les utilisateurs invités ne sont pas automatiquement connectés
            // Ils doivent accepter l'invitation via la modale
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
            photoUrl: true,
          },
        },
        location: true,
        preferences: true,
        photos: true,
        feedbacks: true,
        votes: true,
        notifications: true,
      },
    });

    // Créer une notification pour le créateur
    await prisma.notification.create({
      data: {
        userId: BigInt(userId),
        message: `Création de l'événement "${title}" réussie`,
        type: "EVENT_CREATED",
        eventId: newEvent.id,
      },
    });

    // Créer des notifications pour les utilisateurs invités (sauf le créateur)
    if (
      invitedUsers &&
      Array.isArray(invitedUsers) &&
      invitedUsers.length > 0
    ) {
      const creator = await prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      if (creator) {
        // Filtrer pour ne pas notifier le créateur
        const usersToNotify = invitedUsers.filter(
          (invitedUserId: number) => invitedUserId !== Number(userId),
        );

        if (usersToNotify.length > 0) {
          // Créer une notification pour chaque utilisateur invité
          await prisma.notification.createMany({
            data: usersToNotify.map((invitedUserId: number) => ({
              userId: BigInt(invitedUserId),
              message: `@${creator.firstName} ${creator.lastName} vous a invité à son événement "${title}"`,
              type: "EVENT_INVITATION",
              eventId: newEvent.id,
            })),
          });
        }
      }
    }

    // Map Prisma relation field to `createdBy` for API consumers
    const newEventObj: any = { ...newEvent, createdBy: null };

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(newEventObj, (_, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      ),
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur création event:", error);
    return NextResponse.json(
      { error: "Erreur création event" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const events = await prisma.event.findMany({
      where: {
        users: {
          some: {
            id: BigInt(userId),
          },
        },
      },
      include: {
        tags: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
        location: true,
        preferences: true,
        photos: true,
        feedbacks: true,
        votes: true,
        notifications: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Récupérer les créateurs pour chaque événement
    const mapped = await Promise.all(
      events.map(async (ev: any) => {
        let createdBy = null;
        if (ev.createdById) {
          const creator = await prisma.user.findUnique({
            where: { id: ev.createdById },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          });
          createdBy = creator;
        }
        return { ...ev, createdBy };
      }),
    );

    const eventsJson = JSON.parse(
      JSON.stringify(mapped, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    // Générer un ETag basé sur le userId et les événements
    // Inclure le userId dans le hash pour éviter les collisions entre utilisateurs
    const etag = generateETag({ userId, events: eventsJson });

    // Vérifier si le client a déjà la dernière version
    if (isNotModified(request, etag)) {
      return new NextResponse(null, { status: 304 });
    }

    // Créer la réponse avec les headers de cache (private car spécifique à l'utilisateur)
    const response = NextResponse.json(eventsJson, { status: 200 });
    return addCacheHeaders(response, CACHE_STRATEGIES.SEMI_STATIC, etag);
  } catch (error) {
    console.error("Erreur récupération events:", error);
    return NextResponse.json(
      { error: "Erreur récupération events" },
      { status: 500 },
    );
  }
}
