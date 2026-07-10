// Client Places API (New) — https://places.googleapis.com/v1
// Remplace l'ancienne Nearby Search legacy : les types issus des
// questionnaires (sports_activity_location, hiking_area…) y sont valides.

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby";
const PLACES_TEXT_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.types",
  "places.primaryType",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.priceLevel",
  "places.location",
].join(",");

function getApiKey(): string {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Clé API Google manquante (GOOGLE_MAPS_API_KEY ou NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)",
    );
  }
  return apiKey;
}

export async function geocodeCity(
  city: string,
): Promise<{ lat: number; lng: number }> {
  const url = `${GEOCODE_ENDPOINT}?address=${encodeURIComponent(city)}&key=${getApiKey()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding HTTP ${response.status}`);
  }
  const data = await response.json();
  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(
      `Ville introuvable (${data.status})${data.error_message ? ` : ${data.error_message}` : ""}`,
    );
  }
  return data.results[0].geometry.location;
}

export type NearbyPlace = {
  placeId: string;
  name: string;
  address: string;
  types: string[];
  primaryType: string | null;
  rating: number | null;
  userRatingsTotal: number | null;
  websiteUrl: string | null;
  mapsUrl: string | null;
  businessStatus: string | null;
  /** Niveau de prix Google normalisé 0..4 (null si non renseigné) */
  priceLevel: number | null;
  lat: number | null;
  lng: number | null;
};

type RawPlace = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  types?: string[];
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  priceLevel?: string;
  location?: { latitude?: number; longitude?: number };
};

// Places API (New) renvoie le prix sous forme d'enum : on normalise en 0..4
const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export async function searchNearbyPlaces(params: {
  lat: number;
  lng: number;
  radiusMeters: number;
  includedTypes: string[];
  maxResultCount?: number;
}): Promise<NearbyPlace[]> {
  const { lat, lng, radiusMeters, includedTypes, maxResultCount = 20 } = params;

  const response = await fetch(PLACES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount,
      languageCode: "fr",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: Math.min(Math.max(radiusMeters, 500), 50000),
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Places API (New) HTTP ${response.status}${body ? ` — ${body.slice(0, 300)}` : ""}`,
    );
  }

  const data = await response.json();
  const places: RawPlace[] = Array.isArray(data.places) ? data.places : [];
  return places.map(mapRawPlace);
}

function mapRawPlace(place: RawPlace): NearbyPlace {
  return {
    placeId: place.id,
    name: place.displayName?.text ?? "Lieu sans nom",
    address: place.formattedAddress ?? "",
    types: place.types ?? [],
    primaryType: place.primaryType ?? null,
    rating: place.rating ?? null,
    userRatingsTotal: place.userRatingCount ?? null,
    websiteUrl: place.websiteUri ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    businessStatus: place.businessStatus ?? null,
    priceLevel:
      place.priceLevel != null ? (PRICE_LEVEL_MAP[place.priceLevel] ?? null) : null,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  };
}

// Recherche TEXTUELLE (relevance Google) — indispensable pour les activités que
// la taxonomie de types ne distingue pas (accrobranche, escape game, karting…),
// car Google tague ces lieux comme amusement_park/sports_complex, comme les
// piscines. Le texte ("accrobranche à Versailles") lève l'ambiguïté.
export async function searchTextPlaces(params: {
  textQuery: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  maxResultCount?: number;
}): Promise<NearbyPlace[]> {
  const { textQuery, lat, lng, radiusMeters, maxResultCount = 20 } = params;

  const response = await fetch(PLACES_TEXT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount,
      languageCode: "fr",
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: Math.min(Math.max(radiusMeters, 500), 50000),
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Places API (New) searchText HTTP ${response.status}${body ? ` — ${body.slice(0, 300)}` : ""}`,
    );
  }

  const data = await response.json();
  const places: RawPlace[] = Array.isArray(data.places) ? data.places : [];
  return places.map(mapRawPlace);
}
