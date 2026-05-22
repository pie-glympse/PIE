import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const toJson = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const eventIdStr = segments[2];
    if (!eventIdStr) {
      return NextResponse.json({ message: "eventId manquant" }, { status: 400 });
    }
    const eventId = BigInt(eventIdStr);

    const { userId, selectedGoogleTagIds = [], preferredDate } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: "userId est requis" }, { status: 400 });
    }

    const userIdBigInt = BigInt(userId);
    const parsedIds: bigint[] = Array.isArray(selectedGoogleTagIds)
      ? selectedGoogleTagIds.map((id: string | number) => BigInt(id))
      : [];

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        isSpecificPlace: true,
        startDate: true,
        selectedGoogleTags: { select: { id: true } },
        users: { select: { id: true } },
      },
    });
    if (!event) {
      return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { id: userIdBigInt } });
    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
    }

    const allowedIds = new Set(event.selectedGoogleTags.map((tag) => tag.id.toString()));
    if (!event.isSpecificPlace) {
      if (parsedIds.length === 0) {
        return NextResponse.json(
          { message: "Veuillez sélectionner au moins un thème" },
          { status: 400 },
        );
      }
      const hasInvalid = parsedIds.some((id) => !allowedIds.has(id.toString()));
      if (hasInvalid) {
        return NextResponse.json(
          { message: "Un ou plusieurs thèmes ne sont pas autorisés pour cet événement" },
          { status: 400 },
        );
      }
    }

    const preferredDateValue = preferredDate
      ? new Date(preferredDate)
      : event.startDate || new Date();

    await prisma.$transaction(async (tx) => {
      await tx.eventUserPreference.upsert({
        where: {
          userId_eventId: {
            userId: userIdBigInt,
            eventId,
          },
        },
        update: {
          preferredDate: preferredDateValue,
        },
        create: {
          userId: userIdBigInt,
          eventId,
          preferredDate: preferredDateValue,
        },
      });

      await tx.eventThemeVote.deleteMany({
        where: {
          userId: userIdBigInt,
          eventId,
        },
      });

      if (!event.isSpecificPlace && parsedIds.length > 0) {
        await tx.eventThemeVote.createMany({
          data: parsedIds.map((googleTagId) => ({
            userId: userIdBigInt,
            eventId,
            googleTagId,
          })),
          skipDuplicates: true,
        });
      }
    });

    const organizerId = event.users[0]?.id;
    if (organizerId && organizerId.toString() !== userIdBigInt.toString()) {
      await prisma.notification.create({
        data: {
          userId: organizerId,
          message: `@${user.firstName}${user.lastName} a répondu aux préférences de "${event.title}"`,
          type: "QUESTIONNAIRE_RESPONSE",
          eventId,
        },
      });
    }

    return NextResponse.json(
      toJson({
        message: "Préférences enregistrées",
        eventId,
        userId: userIdBigInt,
        selectedGoogleTagIds: event.isSpecificPlace
          ? []
          : parsedIds.map((id) => id.toString()),
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des préférences:", error);
    return NextResponse.json(
      { message: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
