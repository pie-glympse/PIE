import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";

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
      isSpecificPlace = false,
      googleTagIds = [],
      recurring,
      duration,
      recurringRate,
      userId,
      invitedUsers = [],
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const userIdBigInt = BigInt(userId);
    const parsedGoogleTagIds = Array.isArray(googleTagIds)
      ? googleTagIds.map((id: string | number) => BigInt(id))
      : [];

    if (!isSpecificPlace && parsedGoogleTagIds.length === 0) {
      return NextResponse.json(
        { error: "Au moins un thème est requis" },
        { status: 400 },
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
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
        recurring: recurring || false,
        duration: duration ? Number(duration) : null,
        recurringRate: recurringRate || null,
        updatedAt: new Date(),
        createdById: userIdBigInt,
        users: {
          connect: [{ id: userIdBigInt }],
        },
        ...(isSpecificPlace
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
        users: true,
      },
    });

    if (Array.isArray(invitedUsers) && invitedUsers.length > 0) {
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

    return NextResponse.json(toJson(event), { status: 201 });
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

    const events = await prisma.event.findMany({
      where: { users: { some: { id: BigInt(userId) } } },
      include: {
        selectedGoogleTags: true,
        confirmedGoogleTag: true,
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
        location: true,
        preferences: true,
        photos: true,
        feedbacks: true,
        votes: true,
        notifications: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const response = NextResponse.json(toJson(events), { status: 200 });
    return addCacheHeaders(response, CACHE_STRATEGIES.DYNAMIC);
  } catch (error) {
    console.error("Erreur récupération events:", error);
    return NextResponse.json(
      { error: "Erreur récupération events" },
      { status: 500 },
    );
  }
}
