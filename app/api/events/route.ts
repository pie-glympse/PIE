import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";
import { enrichEventForClient } from "@/lib/event-public";
import { sendEmailTemplate } from "@/lib/brevo";

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
      googleTagGroupIds = [],
      googleTagIds = [],
      recurring,
      duration,
      recurringRate,
      userId,
      invitedUsers = [],
      isPublic = false,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    if (isPublic && (!maxPersons || Number(maxPersons) <= 0)) {
      return NextResponse.json(
        {
          error:
            "Le nombre maximum de participants est obligatoire pour un événement public",
        },
        { status: 400 },
      );
    }

    const userIdBigInt = BigInt(userId);
    const parsedGoogleTagGroupIds = Array.isArray(googleTagGroupIds)
      ? googleTagGroupIds.map((id: string | number) => BigInt(id))
      : Array.isArray(googleTagIds)
        ? []
        : [];
    const parsedGoogleTagIds = Array.isArray(googleTagIds)
      ? googleTagIds.map((id: string | number) => BigInt(id))
      : [];

    if (
      !isSpecificPlace &&
      parsedGoogleTagGroupIds.length === 0 &&
      parsedGoogleTagIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Au moins un groupe d'activité est requis" },
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
        isPublic: Boolean(isPublic),
        publicStatus: "open",
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
          : parsedGoogleTagGroupIds.length > 0
            ? {
                selectedGoogleTagGroups: {
                  connect: parsedGoogleTagGroupIds.map((id) => ({ id })),
                },
              }
            : {
                selectedGoogleTags: {
                  connect: parsedGoogleTagIds.map((id) => ({ id })),
                },
              }),
      },
      include: {
        selectedGoogleTagGroups: {
          include: {
            subGroups: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            },
          },
        },
        selectedGoogleTags: true,
        confirmedGoogleTag: true,
        confirmedGoogleTagSubGroup: true,
        users: true,
        _count: { select: { users: true } },
        User_Event_createdByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyId: true,
          },
        },
      },
    });

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
        select: { companyId: true, firstName: true, lastName: true },
      });
      if (creator?.companyId) {
        const companyUsers = await prisma.user.findMany({
          where: {
            companyId: creator.companyId,
            id: { not: userIdBigInt },
          },
          select: { id: true, email: true, firstName: true, lastName: true },
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

          const isDev = process.env.NODE_ENV === "development";
          const creatorName = `${creator.firstName} ${creator.lastName}`;
          companyUsers.forEach((u) => {
            const recipient = isDev ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com" : u.email;
            sendEmailTemplate({
              to: [{ email: recipient, name: `${u.firstName} ${u.lastName}` }],
              templateId: Number(process.env.BREVO_TEMPLATE_ID_NEW_EVENT),
              params: { FIRSTNAME: u.firstName, EVENT_TITLE: title, CREATOR_NAME: creatorName },
            }).catch((err) => console.error("Erreur mail nouvel event:", err));
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

    return NextResponse.json(toJson(enrichEventForClient(event, userId)), {
      status: 201,
    });
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
        selectedGoogleTagGroups: {
          include: {
            subGroups: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            },
          },
        },
        selectedGoogleTags: true,
        confirmedGoogleTag: true,
        confirmedGoogleTagSubGroup: true,
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
