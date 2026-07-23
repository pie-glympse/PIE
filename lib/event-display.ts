export const EVENT_ILLUSTRATIONS = [
  "/images/illustration/palm.svg",
  "/images/illustration/roundstar.svg",
  "/images/illustration/stack.svg",
] as const;

type ThemeTag = { techName?: string; name?: string };

export function getEventIllustration(indexOrSeed: number | string): string {
  const seed =
    typeof indexOrSeed === "string"
      ? indexOrSeed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : indexOrSeed;
  return EVENT_ILLUSTRATIONS[Math.abs(seed) % EVENT_ILLUSTRATIONS.length];
}

// ─── Identité visuelle par catégorie d'événement ────────────────────────────
// Chaque type d'event a une couleur ET une icône dédiées (cartes, calendrier…).
// Les couleurs sont alignées sur CATEGORY_COLORS de Gcalendar.
export type EventCategoryStyle = {
  slug: string;
  label: string;
  color: string;
  icon: string;
};

const EVENT_CATEGORY_STYLES: Record<string, EventCategoryStyle> = {
  gastronomie: {
    slug: "gastronomie",
    label: "Gastronomie",
    color: "#FF5B5B", // rouge
    icon: "/images/icones/fleur.png",
  },
  sport: {
    slug: "sport",
    label: "Sport",
    color: "#FCC638", // jaune
    icon: "/images/icones/Union.png",
  },
  divertissement: {
    slug: "divertissement",
    label: "Divertissement",
    color: "#F78AFF", // rose
    icon: "/images/icones/star.png",
  },
  culture: {
    slug: "culture",
    label: "Culture",
    color: "#067FF2", // bleu
    icon: "/images/icones/flower.png",
  },
};

// Catégorie « autre » : défaut pour tout event sans catégorie connue.
export const DEFAULT_EVENT_CATEGORY_STYLE: EventCategoryStyle = {
  slug: "autre",
  label: "Autre",
  color: "#B383DE", // violet
  icon: "/images/icones/goute.png",
};

/** Style (couleur + icône + libellé) associé à une catégorie d'événement. */
export function getEventCategoryStyle(
  slug?: string | null,
): EventCategoryStyle {
  if (!slug) return DEFAULT_EVENT_CATEGORY_STYLE;
  return (
    EVENT_CATEGORY_STYLES[slug.toLowerCase()] ?? DEFAULT_EVENT_CATEGORY_STYLE
  );
}

export function getEventThemeColor(tags: ThemeTag[] = []): string {
  if (tags.some((t) => t.techName?.includes("restaurant"))) return "#FF8C42";
  if (tags.some((t) => t.techName?.includes("bar"))) return "#7C3AED";
  if (tags.some((t) => t.techName?.includes("park"))) return "#16A34A";
  return "#FCC638";
}

export function getEventThemeHoverColor(tags: ThemeTag[] = []): string {
  if (tags.some((t) => t.techName?.includes("restaurant"))) return "#E67A35";
  if (tags.some((t) => t.techName?.includes("bar"))) return "#6D28D9";
  if (tags.some((t) => t.techName?.includes("park"))) return "#128A3A";
  return "#E6B330";
}

/** Parse ISO / date-only strings in local timezone (avoids UTC day shift). */
export function parseEventDate(dateString?: string | null): Date | null {
  if (!dateString) return null;
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatEventDateLong(dateString?: string | null): string {
  const date = parseEventDate(dateString);
  if (!date) return "Non définie";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatEventDateShort(dateString?: string | null): string {
  const date = parseEventDate(dateString);
  if (!date) return "Non définie";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export function formatEventTime(dateString?: string | null): string {
  if (!dateString) return "Non définie";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Non définie";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEventCreatedAt(createdAt?: string | null): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}
