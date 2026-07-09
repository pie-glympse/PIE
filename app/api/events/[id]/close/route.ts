import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  aggregateTagScores,
  pickWinningDate,
  getQuestionnaireProgress,
  rankPlaces,
} from "@/lib/event-closure";
import { geocodeCity, searchNearbyPlaces } from "@/lib/google-places-new";

const toJson = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

const PROPOSALS_COUNT = 5;
const TOP_TAGS_FOR_SEARCH = 6;

// ─── GET : statut de clôture (progression des votes + propositions existantes)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const eventId = BigInt(id);
    const userIdStr = new URL(request.url).searchParams.get("userId");
    if (!userIdStr) {
      return NextResponse.json({ message: "userId manquant" }, { status: 400 });
    }
    const userId = BigInt(userIdStr);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        state: true,
        isSpecificPlace: true,
        categoryId: true,
        createdById: true,
      },
    });
    if (!event) {
      return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });
    }

    const isCreator = event.createdById === userId;
    const progress = await getQuestionnaireProgress(prisma, eventId);

    // Les propositions ne sont visibles que par le créateur
    const proposals = isCreator
      ? await prisma.eventPlaceProposal.findMany({
          where: { eventId },
          orderBy: { rank: "asc" },
        })
      : [];

    return NextResponse.json(
      toJson({
        state: event.state,
        isSpecificPlace: event.isSpecificPlace,
        isCreator,
        participantCount: progress.participantCount,
        respondedCount: progress.respondedCount,
        canClose:
          isCreator &&
          !event.isSpecificPlace &&
          event.state?.toLowerCase() === "pending" &&
          progress.respondedCount >= 1,
        proposals,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur statut clôture:", error);
    return NextResponse.json({ message: "Erreur serveur interne" }, { status: 500 });
  }
}

// ─── POST : clôturer les votes → agrégation → Places API (New) → 5 propositions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const eventId = BigInt(id);
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: "userId est requis" }, { status: 400 });
    }
    const userIdBigInt = BigInt(userId);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        state: true,
        city: true,
        maxDistance: true,
        dateKnown: true,
        isSpecificPlace: true,
        categoryId: true,
        createdById: true,
        User_Event_createdByIdToUser: { select: { companyId: true } },
      },
    });
    if (!event) {
      return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });
    }
    if (event.createdById !== userIdBigInt) {
      return NextResponse.json(
        { message: "Seul le créateur peut clôturer les votes" },
        { status: 403 },
      );
    }
    if (event.isSpecificPlace) {
      return NextResponse.json(
        { message: "Cet événement a déjà un lieu précis, il n'y a rien à clôturer" },
        { status: 400 },
      );
    }
    if (event.state?.toLowerCase() === "confirmed") {
      return NextResponse.json(
        { message: "L'événement est déjà confirmé" },
        { status: 400 },
      );
    }

    const progress = await getQuestionnaireProgress(prisma, eventId);
    if (progress.respondedCount < 1) {
      return NextResponse.json(
        { message: "Au moins une réponse au questionnaire est requise pour clôturer" },
        { status: 400 },
      );
    }

    // 1) Agrégation déterministe des tags votés
    const tagScores = await aggregateTagScores(prisma, eventId);
    if (tagScores.length === 0) {
      return NextResponse.json(
        { message: "Aucun vote de thème enregistré, impossible de générer des propositions" },
        { status: 400 },
      );
    }
    const topTags = tagScores.slice(0, TOP_TAGS_FOR_SEARCH);

    // 2) Date gagnante (la plus votée, puis la plus proche)
    const winningDate = await pickWinningDate(prisma, eventId);

    // 3) Requête Google Places (New) autour de la ville de l'événement
    if (!event.city) {
      return NextResponse.json(
        { message: "L'événement n'a pas de ville définie" },
        { status: 400 },
      );
    }
    const center = await geocodeCity(event.city);
    const radiusMeters = (event.maxDistance ?? 10) * 1000;
    const places = await searchNearbyPlaces({
      lat: center.lat,
      lng: center.lng,
      radiusMeters,
      includedTypes: topTags.map((t) => t.techName),
    });

    // 4) Exclure les lieux blacklistés (entreprise + événement)
    const companyId = event.User_Event_createdByIdToUser?.companyId;
    const blacklisted = companyId
      ? await prisma.blacklistedPlace.findMany({
          where: {
            companyId,
            OR: [{ eventId: null }, { eventId }],
          },
          select: { placeId: true },
        })
      : [];
    const blacklistedIds = new Set(blacklisted.map((b) => b.placeId));
    const eligiblePlaces = places.filter((p) => !blacklistedIds.has(p.placeId));

    if (eligiblePlaces.length === 0) {
      return NextResponse.json(
        {
          message:
            "Aucun lieu trouvé pour les activités votées dans cette zone. Essayez d'élargir la distance maximum.",
        },
        { status: 404 },
      );
    }

    // 5) Classement déterministe → 5 propositions
    const ranked = rankPlaces(eligiblePlaces, tagScores, center).slice(
      0,
      PROPOSALS_COUNT,
    );

    const proposals = await prisma.$transaction(async (tx) => {
      await tx.eventPlaceProposal.deleteMany({ where: { eventId } });
      await tx.eventPlaceProposal.createMany({
        data: ranked.map((place, index) => ({
          eventId,
          placeId: place.placeId,
          name: place.name,
          address: place.address,
          rating: place.rating,
          userRatingsTotal: place.userRatingsTotal,
          websiteUrl: place.websiteUrl,
          lat: place.lat,
          lng: place.lng,
          score: place.score,
          rank: index + 1,
        })),
      });

      // Les votes sont clôturés : la date gagnante est posée, état "closed"
      await tx.event.update({
        where: { id: eventId },
        data: {
          state: "closed",
          ...(winningDate ? { startDate: winningDate, endDate: winningDate } : {}),
        },
      });

      return tx.eventPlaceProposal.findMany({
        where: { eventId },
        orderBy: { rank: "asc" },
      });
    });

    return NextResponse.json(
      toJson({
        message: "Votes clôturés : choisissez le lieu final parmi les propositions",
        winningDate,
        topTags,
        proposals,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur clôture des votes:", error);
    const message =
      error instanceof Error ? error.message : "Erreur serveur interne";
    return NextResponse.json({ message }, { status: 500 });
  }
}
