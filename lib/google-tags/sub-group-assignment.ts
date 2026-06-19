import { DEFAULT_SUB_GROUPS_BY_GROUP } from "./default-sub-groups";

const SUB_GROUP_KEYWORDS: Record<string, Record<string, string[]>> = {
  Restauration: {
    Restaurant: [
      "restaurant",
      "bistro",
      "diner",
      "steak",
      "seafood",
      "sushi",
      "pizza",
      "brunch",
      "breakfast",
      "buffet",
      "barbecue",
      "fine_dining",
      "fast_food",
    ],
    "Café & bar": [
      "cafe",
      "coffee",
      "tea_house",
      "bar",
      "pub",
      "wine",
      "brewery",
      "beer",
    ],
    "Boulangerie & pâtisserie": [
      "bakery",
      "bagel",
      "donut",
      "doughnut",
      "ice_cream",
      "chocolate",
      "candy",
    ],
    "Traiteur & buffet": ["cater", "meal", "food_court", "deli", "cafeteria"],
  },
  Afterwork: {
    "Bar & pub": ["bar", "pub", "lounge", "wine_bar", "cocktail"],
    Brasserie: ["brewery", "brewpub", "beer_garden"],
    Nightlife: ["night_club", "casino", "karaoke"],
  },
  "Team Building": {
    "Loisirs & jeux": [
      "amusement",
      "bowling",
      "escape",
      "arcade",
      "trampoline",
      "laser",
      "mini_golf",
      "go_kart",
      "video",
    ],
    "Culture & visites": [
      "museum",
      "gallery",
      "theater",
      "theatre",
      "movie",
      "cinema",
      "zoo",
      "aquarium",
      "monument",
      "landmark",
    ],
    "Nature & outdoor": [
      "park",
      "garden",
      "botanical",
      "camp",
      "hiking",
      "beach",
      "marina",
    ],
  },
  Séminaire: {
    "Salles & conférences": [
      "convention",
      "conference",
      "auditorium",
      "amphitheatre",
      "banquet",
      "event_venue",
      "wedding_venue",
    ],
    "Coworking & bureaux": [
      "coworking",
      "business_center",
      "office",
      "corporate",
      "library",
      "university",
      "school",
    ],
  },
  Sport: {
    "Fitness & gym": ["gym", "fitness", "yoga", "spa", "swimming", "martial"],
    "Sports collectifs": [
      "stadium",
      "arena",
      "soccer",
      "football",
      "basketball",
      "tennis",
      "golf",
      "bowling",
      "skating",
    ],
    "Outdoor & nature": [
      "park",
      "camp",
      "hiking",
      "ski",
      "climbing",
      "athletic",
      "sports_complex",
      "adventure_sports",
    ],
  },
  Autre: {
    Divers: [],
  },
};

export function inferSubGroupNameFromTechName(
  techName: string,
  groupName: string,
): string {
  const normalized = techName.toLowerCase();
  const groupKeywords = SUB_GROUP_KEYWORDS[groupName];

  if (groupKeywords) {
    for (const [subGroupName, keywords] of Object.entries(groupKeywords)) {
      if (keywords.some((keyword) => normalized.includes(keyword))) {
        return subGroupName;
      }
    }
  }

  const defaults = DEFAULT_SUB_GROUPS_BY_GROUP[groupName];
  return defaults?.[0] ?? DEFAULT_SUB_GROUPS_BY_GROUP.Autre[0];
}

export async function getRepresentativeGoogleTagId(
  prisma: {
    googleTag: {
      findFirst: (args: {
        where: {
          subGroupId: bigint;
          isActive: boolean;
          displayName?: { not: null };
        };
        orderBy: { sortOrder: "asc" | "desc" }[];
        select: { id: true };
      }) => Promise<{ id: bigint } | null>;
    };
  },
  subGroupId: bigint,
) {
  const withDisplayName = await prisma.googleTag.findFirst({
    where: {
      subGroupId,
      isActive: true,
      displayName: { not: null },
    },
    orderBy: [{ sortOrder: "asc" }],
    select: { id: true },
  });

  if (withDisplayName) return withDisplayName.id;

  const anyActive = await prisma.googleTag.findFirst({
    where: {
      subGroupId,
      isActive: true,
    },
    orderBy: [{ sortOrder: "asc" }],
    select: { id: true },
  });

  return anyActive?.id ?? null;
}
