import type { PrismaClient } from "@prisma/client";

// ─── Agrégation déterministe des votes du questionnaire ─────────────────────
// Chaque réponse ajoute le poids de l'option à tous ses tags Google Places.
// « Peu importe » (allCategoryTags) ajoute son poids à tous les tags de la
// catégorie : ne change pas le classement mais départage les ex æquo.
//
// Départage des ex æquo (décision projet) :
//   1. score total
//   2. nombre de votants distincts (consensus)
//   3. plus forte contribution unitaire (intensité, ex. réponse Q5 à +4)
//   4. ordre alphabétique du techName (stable, jamais d'aléatoire)

export type TagScore = {
  tagId: bigint;
  techName: string;
  score: number;
  voterCount: number;
  maxContribution: number;
};

export async function aggregateTagScores(
  prisma: PrismaClient,
  eventId: bigint,
): Promise<TagScore[]> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { categoryId: true },
  });
  if (!event?.categoryId) return [];

  // Univers des tags de la catégorie (pour « Peu importe »)
  const categoryOptions = await prisma.questionOption.findMany({
    where: { question: { categoryId: event.categoryId, isActive: true } },
    select: {
      tags: { select: { tag: { select: { id: true, techName: true } } } },
    },
  });
  const categoryTags = new Map<string, { id: bigint; techName: string }>();
  for (const option of categoryOptions) {
    for (const { tag } of option.tags) {
      categoryTags.set(tag.id.toString(), tag);
    }
  }

  const answers = await prisma.eventQuestionnaireAnswer.findMany({
    where: { eventId },
    select: {
      userId: true,
      option: {
        select: {
          weight: true,
          allCategoryTags: true,
          tags: { select: { tag: { select: { id: true, techName: true } } } },
        },
      },
    },
  });

  type Acc = {
    tagId: bigint;
    techName: string;
    score: number;
    voters: Set<string>;
    maxContribution: number;
  };
  const byTag = new Map<string, Acc>();

  const addContribution = (
    tag: { id: bigint; techName: string },
    weight: number,
    userId: bigint,
  ) => {
    const key = tag.id.toString();
    const acc =
      byTag.get(key) ??
      ({
        tagId: tag.id,
        techName: tag.techName,
        score: 0,
        voters: new Set<string>(),
        maxContribution: 0,
      } as Acc);
    acc.score += weight;
    acc.voters.add(userId.toString());
    acc.maxContribution = Math.max(acc.maxContribution, weight);
    byTag.set(key, acc);
  };

  for (const answer of answers) {
    const { weight, allCategoryTags, tags } = answer.option;
    const targets = allCategoryTags
      ? Array.from(categoryTags.values())
      : tags.map(({ tag }) => tag);
    for (const tag of targets) {
      addContribution(tag, weight, answer.userId);
    }
  }

  return Array.from(byTag.values())
    .map((acc) => ({
      tagId: acc.tagId,
      techName: acc.techName,
      score: acc.score,
      voterCount: acc.voters.size,
      maxContribution: acc.maxContribution,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.voterCount - a.voterCount ||
        b.maxContribution - a.maxContribution ||
        a.techName.localeCompare(b.techName),
    );
}

// Date gagnante : la plus votée, puis la plus proche en cas d'ex æquo
export async function pickWinningDate(
  prisma: PrismaClient,
  eventId: bigint,
): Promise<Date | null> {
  const grouped = await prisma.eventUserPreference.groupBy({
    by: ["preferredDate"],
    where: { eventId },
    _count: { preferredDate: true },
  });
  if (grouped.length === 0) return null;

  return grouped.sort(
    (a, b) =>
      b._count.preferredDate - a._count.preferredDate ||
      a.preferredDate.getTime() - b.preferredDate.getTime(),
  )[0].preferredDate;
}

// Nombre de participants ayant répondu au questionnaire (clôture dès 1 réponse)
export async function getQuestionnaireProgress(
  prisma: PrismaClient,
  eventId: bigint,
): Promise<{ participantCount: number; respondedCount: number }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      users: { select: { id: true } },
      preferences: { select: { userId: true } },
    },
  });
  if (!event) return { participantCount: 0, respondedCount: 0 };

  const participantIds = new Set(event.users.map((u) => u.id.toString()));
  const responded = new Set(
    event.preferences
      .map((p) => p.userId.toString())
      .filter((id) => participantIds.has(id)),
  );
  return {
    participantCount: participantIds.size,
    respondedCount: responded.size,
  };
}

// ─── Classement des lieux Google Places ──────────────────────────────────────
// Score lieu = Σ score des tags gagnants présents dans place.types.
// Départage : note Google, puis nombre d'avis, puis distance au centre.

export type ScoredPlace = {
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

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function rankPlaces(
  places: Array<Omit<ScoredPlace, "score"> & { types: string[] }>,
  tagScores: TagScore[],
  center: { lat: number; lng: number },
): ScoredPlace[] {
  const scoreByTechName = new Map(
    tagScores.map((t) => [t.techName, t.score]),
  );

  const distance = (p: ScoredPlace) =>
    p.lat != null && p.lng != null
      ? haversineKm(center, { lat: p.lat, lng: p.lng })
      : Number.MAX_SAFE_INTEGER;

  return places
    .map((place) => ({
      ...place,
      score: place.types.reduce(
        (sum, type) => sum + (scoreByTechName.get(type) ?? 0),
        0,
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.rating ?? 0) - (a.rating ?? 0) ||
        (b.userRatingsTotal ?? 0) - (a.userRatingsTotal ?? 0) ||
        distance(a) - distance(b) ||
        a.placeId.localeCompare(b.placeId),
    );
}
