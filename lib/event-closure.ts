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

// ─── Matchmaking des dates ───────────────────────────────────────────────────
// Chaque votant peut cocher plusieurs jours (DragRangeCalendar). On calcule,
// pour chaque jour, le taux de présence = votants l'ayant coché / total votants.
// Sert au créateur pour retenir les dates qui conviennent au plus grand nombre.
export type DatePresence = {
  date: string; // YYYY-MM-DD
  count: number; // votants ayant coché ce jour
  percentage: number; // count / totalVoters * 100 (arrondi)
};

export async function aggregateDatePresence(
  prisma: PrismaClient,
  eventId: bigint,
): Promise<{ totalVoters: number; presence: DatePresence[] }> {
  const prefs = await prisma.eventUserPreference.findMany({
    where: { eventId },
    select: { preferredDate: true, preferredDates: true },
  });
  const totalVoters = prefs.length;
  const counts = new Map<string, number>();
  for (const p of prefs) {
    // Compat : anciennes lignes sans tableau → on retombe sur la date unique.
    const days =
      p.preferredDates.length > 0
        ? p.preferredDates
        : [p.preferredDate.toISOString().split("T")[0]];
    const unique = new Set(days.map((d) => d.slice(0, 10)));
    for (const day of unique) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const presence = Array.from(counts.entries())
    .map(([date, count]) => ({
      date,
      count,
      percentage: totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));
  return { totalVoters, presence };
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

// ─── Garde-fous sur les lieux Google ────────────────────────────────────────
// On écarte les lieux inadaptés à un événement d'entreprise :
//  - fermés (businessStatus)
//  - grands équipements « pro » non privatisables (stade/arène en type principal :
//    Parc des Princes, Roland Garros… qui matchent le tag "stadium" du sport)
//  - trop chers pour le budget indiqué (priceLevel > budget)

// Types PRINCIPAUX écartés : lieux inadaptés à un événement d'entreprise. On
// ne filtre que sur le type principal (primaryType) pour ne pas exclure un
// lieu réservable qui aurait ce type en secondaire.
//  - stade/arène pro non privatisables (Parc des Princes, Roland Garros)
//  - lieux publics / non-réservables sans intérêt : aire de jeux enfants,
//    attraction touristique générique, administratif, transports
// (Les parcs/jardins/aires nature sont volontairement CONSERVÉS.)
const EXCLUDED_PRIMARY_TYPES = new Set<string>([
  "stadium",
  "arena",
  "playground",
  "tourist_attraction",
  "city_hall",
  "local_government_office",
  "courthouse",
  "embassy",
  "parking",
  "bus_station",
  "subway_station",
  "train_station",
  "light_rail_station",
  "transit_station",
]);

/** Budget indicatif par personne (€) → niveau de prix Google maximal toléré (0..4). */
export function budgetToMaxPriceLevel(
  costPerPerson: number | null | undefined,
): number | null {
  if (costPerPerson == null || costPerPerson <= 0) return null; // pas de budget → pas de filtre
  if (costPerPerson <= 15) return 1; // €
  if (costPerPerson <= 40) return 2; // €€
  if (costPerPerson <= 80) return 3; // €€€
  return 4; // €€€€
}

export type PlaceGuardInput = {
  placeId: string;
  primaryType: string | null;
  businessStatus: string | null;
  priceLevel: number | null;
};

export function isPlaceEligible(
  place: PlaceGuardInput,
  opts: { maxPriceLevel: number | null; blacklistedIds: Set<string> },
): boolean {
  if (opts.blacklistedIds.has(place.placeId)) return false;
  // Fermé définitivement/temporairement (on garde OPERATIONAL et statut inconnu)
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL") return false;
  // Équipement pro non privatisable
  if (place.primaryType && EXCLUDED_PRIMARY_TYPES.has(place.primaryType)) return false;
  // Budget : on n'écarte que si le prix est connu ET dépasse le plafond
  if (
    opts.maxPriceLevel != null &&
    place.priceLevel != null &&
    place.priceLevel > opts.maxPriceLevel
  ) {
    return false;
  }
  return true;
}

// ─── Garde-fou HORAIRES : le lieu doit être ouvert pendant l'événement ───────
// Google Places (New) renvoie regularOpeningHours.periods : chaque période a un
// `open` {day,hour,minute} et un `close` {day,hour,minute}. Convention Google :
// day 0 = dimanche … 6 = samedi — IDENTIQUE à Date.getDay(). Cas particuliers :
//   - lieu ouvert 24h/24 → une seule période { open } SANS close ;
//   - période franchissant minuit → close.day = open.day + 1 (ou retour à 0).
// On raisonne en « minutes de la semaine » (0..10079) sur une timeline doublée
// (0..20159) pour gérer sans modulo les fenêtres à cheval sur minuit / dimanche.

export type OpeningTimePoint = { day: number; hour: number; minute: number };
export type OpeningPeriod = { open: OpeningTimePoint; close?: OpeningTimePoint };

// Une session = un jour concret de l'événement (weekday 0..6) et sa fenêtre
// horaire en minutes depuis minuit. endMinute <= startMinute ⇒ la fenêtre
// franchit minuit (ex. soirée 23h→1h). startMinute = 0 & endMinute = 120 est le
// cas « minuit → 2h » : une fenêtre normale intra-journée.
export type EventSession = {
  weekday: number;
  startMinute: number;
  endMinute: number;
};

const DAY_MINUTES = 24 * 60;
const WEEK_MINUTES = 7 * DAY_MINUTES;

const pointToWeekMinute = (p: OpeningTimePoint): number =>
  (((p.day % 7) * DAY_MINUTES + p.hour * 60 + p.minute) % WEEK_MINUTES +
    WEEK_MINUTES) %
  WEEK_MINUTES;

// Intervalles d'ouverture projetés sur une semaine DOUBLÉE (chaque période est
// dupliquée +1 semaine) afin qu'une session proche de la frontière dimanche/
// lundi reste couverte par une continuité d'ouverture.
function openIntervalsDoubled(
  periods: OpeningPeriod[],
): Array<[number, number]> {
  const intervals: Array<[number, number]> = [];
  for (const period of periods) {
    if (!period.open) continue;
    // Période sans close = ouvert en continu (24h/24) → couvre toute la timeline.
    if (!period.close) return [[0, 2 * WEEK_MINUTES]];
    const start = pointToWeekMinute(period.open);
    let end = pointToWeekMinute(period.close);
    if (end <= start) end += WEEK_MINUTES; // franchit minuit / la semaine
    intervals.push([start, end]);
    intervals.push([start + WEEK_MINUTES, end + WEEK_MINUTES]);
  }
  return intervals;
}

function mergeIntervals(
  intervals: Array<[number, number]>,
): Array<[number, number]> {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [[...sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const [a, b] = sorted[i];
    if (a <= last[1]) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  return merged;
}

/**
 * Le lieu est-il ouvert pendant TOUTES les sessions de l'événement ?
 * Politique (comme les autres garde-fous) : horaires inconnus ⇒ on garde le lieu.
 * Un lieu n'est écarté que si Google fournit des horaires ET que ceux-ci ne
 * couvrent pas entièrement au moins une session.
 */
export function isPlaceOpenForSessions(
  periods: OpeningPeriod[] | null | undefined,
  sessions: EventSession[],
): boolean {
  if (!periods || periods.length === 0) return true; // horaires inconnus → garder
  if (sessions.length === 0) return true; // pas de fenêtre → rien à vérifier

  const intervals = mergeIntervals(openIntervalsDoubled(periods));
  return sessions.every((session) => {
    const start = session.weekday * DAY_MINUTES + session.startMinute;
    const length =
      session.endMinute > session.startMinute
        ? session.endMinute - session.startMinute
        : DAY_MINUTES - session.startMinute + session.endMinute;
    if (length <= 0) return true; // fenêtre dégénérée → on ne juge pas
    const end = start + length;
    // La session doit tenir ENTIÈREMENT dans une plage d'ouverture continue.
    // On la teste aussi décalée de +1 semaine : une session tôt le dimanche
    // (ex. minuit→2h) est couverte par la plage du samedi soir qui franchit
    // minuit, exprimée en fin de timeline doublée.
    const fits = (s: number, e: number) =>
      intervals.some(([a, b]) => a <= s && e <= b);
    return fits(start, end) || fits(start + WEEK_MINUTES, end + WEEK_MINUTES);
  });
}

/** Jours calendaires de start..end inclus (borné à 14 j pour éviter les abus). */
export function eachDayBetween(
  start: Date | null | undefined,
  end: Date | null | undefined,
): Date[] {
  if (!start) return [];
  const cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  );
  const stopSource = end ?? start;
  const stop = new Date(
    stopSource.getFullYear(),
    stopSource.getMonth(),
    stopSource.getDate(),
  );
  const days: Date[] = [];
  while (cursor <= stop && days.length < 14) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Construit les sessions d'un événement à partir de ses jours et de sa fenêtre
 * horaire quotidienne. Multi-jours : une session par jour, chacune sur la même
 * fenêtre [start,end] — « sans compter la nuit » entre les jours (on ne vérifie
 * pas l'ouverture nocturne entre deux journées). Renvoie [] si l'heure manque.
 */
export function buildEventSessions(params: {
  days: Date[];
  startMinute: number | null;
  endMinute: number | null;
}): EventSession[] {
  const { days, startMinute, endMinute } = params;
  if (startMinute == null || endMinute == null || days.length === 0) return [];
  return days.map((day) => ({
    weekday: day.getDay(),
    startMinute,
    endMinute,
  }));
}

/** Minutes depuis minuit d'un champ time stocké en DateTime (heure locale). */
export function timeToMinutes(
  time: Date | string | null | undefined,
): number | null {
  if (time == null) return null;
  const d = time instanceof Date ? time : new Date(time);
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

// ─── Garde-fou de PERTINENCE (relatif à l'intention votée) ───────────────────
// Le fast-food/les chaînes ne doivent sortir que si l'intention "sur le pouce"
// a été votée (sinon McDonald's remonte sur une recherche indienne/exotique).
// Les lieux hors-domaine (magasin, supermarché, station-service…) au nom
// trompeur ("Le Monde du Couteau Japonais") sont toujours écartés.
const FAST_FOOD_TYPES = new Set<string>([
  "fast_food_restaurant",
  "hamburger_restaurant",
  "meal_takeaway",
]);

const OFF_DOMAIN_PRIMARY = new Set<string>([
  "store",
  "grocery_store",
  "grocery_or_supermarket",
  "supermarket",
  "convenience_store",
  "department_store",
  "shopping_mall",
  "market",
  "gas_station",
  "service",
  "wholesaler",
  "food_store",
]);

export function isRelevantToVotes(
  place: { primaryType: string | null },
  votedTypes: Set<string>,
): boolean {
  const pt = place.primaryType;
  if (!pt) return true; // pas d'info de type → on garde
  if (OFF_DOMAIN_PRIMARY.has(pt)) return false;
  // Fast-food : autorisé uniquement si un tag fast-food a été voté
  if (FAST_FOOD_TYPES.has(pt)) {
    const fastFoodVoted = [...FAST_FOOD_TYPES].some((t) => votedTypes.has(t));
    if (!fastFoodVoted) return false;
  }
  return true;
}

// ─── Requête textuelle depuis les tags votés ────────────────────────────────
// La taxonomie de types Google ne distingue pas certaines activités (accrobranche,
// escape game, karting… tous tagués amusement_park/sports_complex comme les
// piscines). On traduit les tags gagnants en mots-clés FR et on interroge Google
// en TEXTE (relevance), ce qui lève l'ambiguïté. Les tags trop génériques
// (sports_complex, event_venue…) n'ont pas de mot-clé et sont ignorés.
const TAG_KEYWORDS: Record<string, string> = {
  // Sport / plein air / sensations
  adventure_sports_center: "accrobranche parc aventure",
  hiking_area: "randonnée",
  off_roading_area: "quad tout-terrain",
  cycling_park: "parcours vélo",
  ski_resort: "ski",
  golf_course: "golf",
  swimming_pool: "piscine",
  fishing_pond: "étang de pêche",
  fishing_charter: "sortie pêche",
  ice_skating_rink: "patinoire",
  fitness_center: "salle de sport",
  gym: "salle de sport",
  water_park: "parc aquatique",
  amusement_park: "parc d'attractions",
  // Divertissement
  bowling_alley: "bowling",
  video_arcade: "salle d'arcade",
  karaoke: "karaoké",
  roller_coaster: "parc d'attractions",
  skateboard_park: "skatepark",
  planetarium: "planétarium",
  aquarium: "aquarium",
  zoo: "zoo",
  wildlife_park: "parc animalier",
  wildlife_refuge: "réserve naturelle",
  historical_landmark: "monument historique",
  night_club: "boîte de nuit",
  dance_hall: "salle de danse",
  comedy_club: "café-théâtre",
  concert_hall: "salle de concert",
  movie_theater: "cinéma",
  opera_house: "opéra",
  philharmonic_hall: "philharmonie",
  park: "parc",
  garden: "jardin",
  botanical_garden: "jardin botanique",
  national_park: "parc national",
  picnic_ground: "aire de pique-nique",
  observation_deck: "point de vue",
  barbecue_area: "aire de barbecue",
  // Culture
  art_gallery: "galerie d'art",
  art_studio: "atelier d'art",
  sculpture: "exposition sculpture",
  museum: "musée",
  historical_place: "lieu historique",
  monument: "monument",
  performing_arts_theater: "théâtre",
  auditorium: "auditorium",
  cultural_landmark: "site culturel",
  // Gastronomie
  restaurant: "restaurant",
  french_restaurant: "restaurant français",
  italian_restaurant: "restaurant italien",
  japanese_restaurant: "restaurant japonais",
  mexican_restaurant: "restaurant mexicain",
  indian_restaurant: "restaurant indien",
  lebanese_restaurant: "restaurant libanais",
  asian_restaurant: "restaurant asiatique",
  korean_restaurant: "restaurant coréen",
  vietnamese_restaurant: "restaurant vietnamien",
  thai_restaurant: "restaurant thaïlandais",
  middle_eastern_restaurant: "restaurant oriental",
  fine_dining_restaurant: "restaurant gastronomique",
  steak_house: "steakhouse",
  seafood_restaurant: "fruits de mer",
  sushi_restaurant: "sushi",
  pizza_restaurant: "pizzeria",
  barbecue_restaurant: "barbecue",
  vegetarian_restaurant: "restaurant végétarien",
  vegan_restaurant: "restaurant vegan",
  juice_shop: "bar à jus",
  fast_food_restaurant: "fast food",
  hamburger_restaurant: "burger",
  sandwich_shop: "sandwicherie",
  bakery: "boulangerie",
  dessert_shop: "pâtisserie",
  ice_cream_shop: "glacier",
  chocolate_shop: "chocolatier",
  bar: "bar",
  wine_bar: "bar à vin",
  pub: "pub",
  bar_and_grill: "bar grill",
  cafe: "café",
  coffee_shop: "café",
  tea_house: "salon de thé",
  brunch_restaurant: "brunch",
  breakfast_restaurant: "petit-déjeuner",
};

/** Mots-clés d'activité issus des tags les plus votés (ordre = importance du vote). */
export function getActivityKeywords(tagScores: TagScore[], max = 4): string[] {
  const keywords: string[] = [];
  for (const t of tagScores) {
    const kw = TAG_KEYWORDS[t.techName];
    if (kw && !keywords.includes(kw)) {
      keywords.push(kw);
      if (keywords.length >= max) break;
    }
  }
  return keywords;
}

/** Entrelace plusieurs listes (round-robin) pour varier les propositions :
 *  1er de la liste 1, 1er de la 2, … puis 2e de chaque, etc. */
export function interleave<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const maxLen = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

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

  // Score = plus forte intention matchée (MAX), pas la somme : un lieu qui coche
  // beaucoup de tags faibles (centre aquatique multi-activités) ne doit pas
  // dépasser un lieu qui matche fortement l'intention gagnante (accrobranche).
  // Le total sert seulement à départager à intention égale.
  return places
    .map((place) => {
      const matched = place.types
        .map((type) => scoreByTechName.get(type) ?? 0)
        .filter((s) => s > 0);
      const best = matched.length ? Math.max(...matched) : 0;
      const total = matched.reduce((sum, s) => sum + s, 0);
      return { ...place, score: best, total };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.total - a.total ||
        (b.rating ?? 0) - (a.rating ?? 0) ||
        (b.userRatingsTotal ?? 0) - (a.userRatingsTotal ?? 0) ||
        distance(a) - distance(b) ||
        a.placeId.localeCompare(b.placeId),
    );
}
