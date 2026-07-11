import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  aggregateTagScores,
  aggregateDatePresence,
  pickWinningDate,
  getQuestionnaireProgress,
  rankPlaces,
  budgetToMaxPriceLevel,
  isPlaceEligible,
  isRelevantToVotes,
  getActivityKeywords,
  interleave,
} from "@/lib/event-closure";
import {
  geocodeCity,
  searchNearbyPlaces,
  searchTextPlaces,
} from "@/lib/google-places-new";
import { requireAuthUser } from "@/lib/server-auth";

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
    const auth = await requireAuthUser(
      request,
      new URL(request.url).searchParams.get("userId"),
    );
    if (!auth.ok) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        state: true,
        isSpecificPlace: true,
        dateKnown: true,
        proposedDates: true,
        confirmedDates: true,
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

    // Matchmaking des dates : taux de présence par jour (créateur uniquement),
    // uniquement si la date n'était pas fixée d'avance.
    const dateMatchmaking =
      isCreator && !event.dateKnown
        ? await aggregateDatePresence(prisma, eventId)
        : { totalVoters: 0, presence: [] };

    return NextResponse.json(
      toJson({
        state: event.state,
        isSpecificPlace: event.isSpecificPlace,
        dateKnown: event.dateKnown,
        proposedDates: event.proposedDates,
        confirmedDates: event.confirmedDates,
        isCreator,
        participantCount: progress.participantCount,
        respondedCount: progress.respondedCount,
        canClose:
          isCreator &&
          !event.isSpecificPlace &&
          event.state?.toLowerCase() === "pending" &&
          progress.respondedCount >= 1,
        proposals,
        datePresence: dateMatchmaking.presence,
        dateVoterCount: dateMatchmaking.totalVoters,
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
    // excludePlaceIds : lieux déjà vus (bouton "Relancer" → 5 autres propositions)
    const { userId, excludePlaceIds = [] } = await request.json();
    const excludeSet = new Set<string>(
      Array.isArray(excludePlaceIds) ? excludePlaceIds.map(String) : [],
    );
    const auth = await requireAuthUser(request, userId);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const userIdBigInt = auth.userId;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        state: true,
        city: true,
        maxDistance: true,
        costPerPerson: true,
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
    // Note : on autorise la (re)génération même si l'événement est déjà
    // confirmé, pour permettre au créateur de "Relancer" et changer de lieu.

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

    // Garde-fous communs (blacklist entreprise/événement + fermés + non
    // privatisables + budget)
    const companyId = event.User_Event_createdByIdToUser?.companyId;
    const blacklisted = companyId
      ? await prisma.blacklistedPlace.findMany({
          where: { companyId, OR: [{ eventId: null }, { eventId }] },
          select: { placeId: true },
        })
      : [];
    const blacklistedIds = new Set(blacklisted.map((b) => b.placeId));
    const maxPriceLevel = budgetToMaxPriceLevel(
      event.costPerPerson != null ? Number(event.costPerPerson) : null,
    );
    // Types Google réellement votés → sert au garde-fou de pertinence
    // (ex. écarter le fast-food si personne n'a voté "sur le pouce").
    const votedTypes = new Set(tagScores.map((t) => t.techName));
    const isEligible = (p: { placeId: string; primaryType: string | null; businessStatus: string | null; priceLevel: number | null }) =>
      !excludeSet.has(p.placeId) &&
      isPlaceEligible(p, { maxPriceLevel, blacklistedIds }) &&
      isRelevantToVotes(p, votedTypes);

    type ProposalCandidate = {
      placeId: string;
      name: string;
      address: string;
      rating: number | null;
      userRatingsTotal: number | null;
      websiteUrl: string | null;
      lat: number | null;
      lng: number | null;
      score: number;
    };
    let ranked: ProposalCandidate[] = [];

    // 3) Recherche TEXTUELLE par intention (relevance Google). On interroge
    //    CHAQUE mot-clé voté séparément puis on ENTRELACE les résultats pour
    //    varier les propositions (accrobranche + parc aquatique + rando…),
    //    au lieu de 5 fois la même chose. Les garde-fous + les lieux déjà vus
    //    (relaunch) sont filtrés.
    const keywords = getActivityKeywords(tagScores, 4);
    if (keywords.length > 0) {
      const perKeyword = await Promise.all(
        keywords.map((kw) =>
          searchTextPlaces({
            textQuery: kw,
            lat: center.lat,
            lng: center.lng,
            radiusMeters,
            maxResultCount: 12,
          }).catch(() => []),
        ),
      );
      const seen = new Set<string>();
      const varied = interleave(perKeyword).filter((p) => {
        if (seen.has(p.placeId) || !isEligible(p)) return false;
        seen.add(p.placeId);
        return true;
      });
      ranked = varied
        .slice(0, PROPOSALS_COUNT)
        .map((p) => ({ ...p, score: p.rating ?? 0 }));
    }

    // 3bis) Fallback : recherche par types + classement par intention forte
    if (ranked.length === 0) {
      const places = await searchNearbyPlaces({
        lat: center.lat,
        lng: center.lng,
        radiusMeters,
        includedTypes: topTags.map((t) => t.techName),
      });
      const eligible = places.filter(isEligible);
      ranked = rankPlaces(eligible, tagScores, center).slice(0, PROPOSALS_COUNT);
    }

    if (ranked.length === 0) {
      return NextResponse.json(
        {
          message:
            excludeSet.size > 0
              ? "Vous avez fait le tour des propositions disponibles pour cette zone."
              : "Aucun lieu adapté trouvé (après filtrage des lieux fermés, non privatisables ou hors budget). Essayez d'élargir la distance ou le budget.",
          noMore: excludeSet.size > 0,
        },
        { status: 404 },
      );
    }

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
