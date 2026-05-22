const GOOGLE_TYPES_URLS = [
  "https://developers.google.com/maps/documentation/places/web-service/place-types",
  "https://developers.google.com/maps/documentation/places/web-service/legacy/supported_types",
];

const MIN_EXPECTED_TYPES = 50;
const IGNORED_TOKENS = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "types",
  "type",
  "primary_type",
  "includedtypes",
  "excludedtypes",
  "includedprimarytypes",
  "excludedprimarytypes",
  "cities",
  "regions",
  "next",
]);

function normalizeTechName(raw: string) {
  return raw.trim().toLowerCase();
}

function extractFromHtml(html: string) {
  const typeSet = new Set<string>();
  const codeInTableRegex = /<td[^>]*>\s*<code[^>]*>([a-z_]+)<\/code>/gi;
  const genericCodeRegex = /<code[^>]*>([a-z_]+)<\/code>/gi;

  let match: RegExpExecArray | null;
  while ((match = codeInTableRegex.exec(html)) !== null) {
    const normalized = normalizeTechName(match[1]);
    if (!IGNORED_TOKENS.has(normalized) && /^[a-z]+(?:_[a-z]+)*$/.test(normalized)) {
      typeSet.add(normalized);
    }
  }

  while ((match = genericCodeRegex.exec(html)) !== null) {
    const normalized = normalizeTechName(match[1]);
    if (!IGNORED_TOKENS.has(normalized) && /^[a-z]+(?:_[a-z]+)*$/.test(normalized)) {
      typeSet.add(normalized);
    }
  }

  return typeSet;
}

export async function fetchGooglePlaceTypesFromDocs() {
  const typeSet = new Set<string>();
  const warnings: string[] = [];

  for (const url of GOOGLE_TYPES_URLS) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        warnings.push(`Failed to fetch ${url}: ${response.status}`);
        continue;
      }

      const html = await response.text();
      const extracted = extractFromHtml(html);
      extracted.forEach((type) => typeSet.add(type));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to fetch ${url}: ${message}`);
    }
  }

  if (typeSet.size < MIN_EXPECTED_TYPES) {
    throw new Error(
      `Sync parser extracted only ${typeSet.size} types, below minimum ${MIN_EXPECTED_TYPES}. Check Google docs parser.`,
    );
  }

  return {
    types: Array.from(typeSet).sort((a, b) => a.localeCompare(b)),
    warnings,
  };
}
