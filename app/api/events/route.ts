import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";
import { enrichEventForClient } from "@/lib/event-public";
import { requireAuthUser } from "@/lib/server-auth";

const toJson = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

const createDateOnly = (dateString?: string) =>
  dateString ? new Date(dateString) : null;
const createTimeOnly = (timeString?: string) =>
  timeString ? new Date(`1970-01-01T${timeString}:00`) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description = "",
      additionalInfo = "",
      dateKnown = true,
      proposedDates = [],
      startDate,
      endDate,
      startTime,
      endTime,
      maxPersons,
      costPerPerson,
      state,
      city,
      maxDistance,
      placeName,
      placeAddress,
      placeId,
      placeLat,
      placeLng,
      isSpecificPlace = false,
      categoryId = null,
      googleTagIds = [],
      recurring,
      duration,
      recurringRate,
      userId,
      invitedUsers = [],
      isPublic = false,
    } = body;

    // L'identité vient de la session (cookie JWT), jamais du client
    const auth = await requireAuthUser(request, userId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { error: "Le nom de l'événement est obligatoire" },
        { status: 400 },
      );
    }

    if (isPublic && (!maxPersons || Number(maxPersons) <= 0)) {
      return NextResponse.json(
        { error: "Le nombre maximum de participants est obligatoire pour un événement public" },
        { status: 400 },
      );
    }

    const userIdBigInt = auth.userId;
    const parsedGoogleTagIds = Array.isArray(googleTagIds)
      ? googleTagIds.map((id: string | number) => BigInt(id))
      : [];

    if (isSpecificPlace) {
      if (!placeName || !placeAddress) {
        return NextResponse.json(
          { error: "Le nom et l'adresse du lieu sont obligatoires" },
          { status: 400 },
        );
      }
    } else if (!categoryId && parsedGoogleTagIds.length === 0) {
      return NextResponse.json(
        { error: "Une catégorie d'événement est requise" },
        { status: 400 },
      );
    }

    // Plage de dates (date non connue) : les participants votent une date dedans
    if (!dateKnown && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: "Une plage de dates (début et fin) est requise quand la date n'est pas connue" },
        { status: 400 },
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: String(description || ""),
        additionalInfo: String(additionalInfo || ""),
        dateKnown: Boolean(dateKnown),
        proposedDates: Array.isArray(proposedDates)
          ? proposedDates.map(String)
          : [],
        startDate: createDateOnly(startDate),
        endDate: createDateOnly(endDate),
        startTime: createTimeOnly(startTime),
        endTime: createTimeOnly(endTime),
        maxPersons: maxPersons ? BigInt(maxPersons) : null,
        costPerPerson: costPerPerson ? BigInt(costPerPerson) : null,
        state,
        city: isSpecificPlace
          ? `${placeName || ""} ${placeAddress || ""}`.trim()
          : city,
        maxDistance: maxDistance ? Number(maxDistance) : null,
        isSpecificPlace,
        isPublic: Boolean(isPublic),
        publicStatus: "open",
        recurring: recurring || false,
        duration: duration ? Number(duration) : null,
        recurringRate: recurringRate || null,
        updatedAt: new Date(),
        createdById: userIdBigInt,
        ...(categoryId ? { categoryId: BigInt(categoryId) } : {}),
        users: {
          connect: [{ id: userIdBigInt }],
        },
        ...(isSpecificPlace || parsedGoogleTagIds.length === 0
          ? {}
          : {
              selectedGoogleTags: {
                connect: parsedGoogleTagIds.map((id) => ({ id })),
              },
            }),
      },
      include: {
        selectedGoogleTags: true,
        confirmedGoogleTag: true,
        category: true,
        users: true,
        _count: { select: { users: true } },
        User_Event_createdByIdToUser: {
          select: { id: true, firstName: true, lastName: true, email: true, companyId: true },
        },
      },
    });

    // Lieu précis (« je sais ce que je veux ») : enregistrer le lieu structuré
    if (isSpecificPlace) {
      await prisma.eventLocation.create({
        data: {
          id: event.id,
          eventId: event.id,
          placeId: placeId || null,
          name: placeName,
          address: placeAddress,
          lat: typeof placeLat === "number" ? placeLat : null,
          lng: typeof placeLng === "number" ? placeLng : null,
        },
      });
    }

    if (!isPublic && Array.isArray(invitedUsers) && invitedUsers.length > 0) {
      await prisma.notification.createMany({
        data: invitedUsers
          .filter((invitedUserId: number) => invitedUserId !== Number(userId))
          .map((invitedUserId: number) => ({
            userId: BigInt(invitedUserId),
            message: `Invitation à l'événement "${title}"`,
            type: "EVENT_INVITATION",
            eventId: event.id,
          })),
      });
    }

    if (isPublic) {
      const creator = await prisma.user.findUnique({
        where: { id: userIdBigInt },
        select: { companyId: true },
      });
      if (creator?.companyId) {
        const companyUsers = await prisma.user.findMany({
          where: {
            companyId: creator.companyId,
            id: { not: userIdBigInt },
          },
          select: { id: true },
        });
        if (companyUsers.length > 0) {
          await prisma.notification.createMany({
            data: companyUsers.map((u) => ({
              userId: u.id,
              message: `Nouvel événement public : "${title}" — des places sont disponibles`,
              type: "EVENT_PUBLIC_AVAILABLE",
              eventId: event.id,
            })),
          });
        }
      }
    }

    const { addPoints, POINT_ACTIONS } = await import("@/lib/points-badges");
    await addPoints(
      userIdBigInt,
      POINT_ACTIONS.EVENT_CREATED,
      "event_created",
      `Création de l'événement "${title}"`,
      event.id,
    ).catch(() => {});

    return NextResponse.json(
      toJson(enrichEventForClient(event, userIdBigInt.toString())),
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
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { companyId: true },
    });

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { users: { some: { id: BigInt(userId) } } },
          ...(currentUser?.companyId
            ? [
                {
                  isPublic: true,
                  publicStatus: { not: "closed" },
                  User_Event_createdByIdToUser: {
                    companyId: currentUser.companyId,
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        selectedGoogleTags: true,
        confirmedGoogleTag: true,
        category: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
            companyId: true,
          },
        },
        User_Event_createdByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyId: true,
          },
        },
        location: true,
        preferences: true,
        photos: true,
        feedbacks: true,
        votes: true,
        notifications: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const uniqueEvents = Array.from(
      new Map(events.map((e) => [e.id.toString(), e])).values(),
    );

    const enriched = uniqueEvents.map((e) => enrichEventForClient(e, userId));
    const response = NextResponse.json(toJson(enriched), { status: 200 });
    return addCacheHeaders(response, CACHE_STRATEGIES.DYNAMIC);
  } catch (error) {
    console.error("Erreur récupération events:", error);
    return NextResponse.json(
      { error: "Erreur récupération events" },
      { status: 500 },
    );
  }
}
