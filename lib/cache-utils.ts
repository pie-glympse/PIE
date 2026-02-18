/**
 * Utilitaires de cache pour les routes API
 * 
 * Ce module fournit des fonctions pour gérer le cache HTTP côté serveur et client.
 * Il implémente la stratégie de cache définie dans CACHE_STRATEGY.md.
 * 
 * Utilisation typique dans une route API :
 * 
 * ```typescript
 * import { generateETag, isNotModified, addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";
 * 
 * export async function GET(request: NextRequest) {
 *   const data = await fetchData();
 *   const etag = generateETag(data);
 * 
 *   if (isNotModified(request, etag)) {
 *     return new NextResponse(null, { status: 304 });
 *   }
 * 
 *   const response = NextResponse.json(data);
 *   return addCacheHeaders(response, CACHE_STRATEGIES.SEMI_STATIC, etag);
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

/**
 * Génère un ETag à partir du contenu
 * @param content - Le contenu à hasher (string ou object)
 * @returns L'ETag (ex: "abc123")
 */
export function generateETag(content: string | object): string {
  const contentString = typeof content === "string" 
    ? content 
    : JSON.stringify(content);
  
  return createHash("md5")
    .update(contentString)
    .digest("hex");
}

/**
 * Vérifie si le client a une version à jour en comparant les ETags
 * @param request - La requête Next.js
 * @param etag - L'ETag actuel du contenu
 * @returns true si le client a déjà la dernière version
 */
export function isNotModified(request: NextRequest, etag: string): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  return ifNoneMatch === etag || ifNoneMatch === `"${etag}"`;
}

/**
 * Ajoute les headers de cache à une réponse
 * @param response - La réponse Next.js
 * @param cacheControl - La valeur du header Cache-Control
 * @param etag - Optionnel : l'ETag du contenu
 * @returns La réponse avec les headers ajoutés
 */
export function addCacheHeaders(
  response: NextResponse,
  cacheControl: string,
  etag?: string
): NextResponse {
  response.headers.set("Cache-Control", cacheControl);
  
  if (etag) {
    response.headers.set("ETag", `"${etag}"`);
  }
  
  return response;
}

/**
 * Constantes pour les stratégies de cache communes
 */
export const CACHE_STRATEGIES = {
  // Ressources statiques (images, fonts, etc.) - 1 an
  STATIC: "public, max-age=31536000, immutable",
  
  // Données statiques (tags, company) - 1 heure avec revalidation
  STATIC_DATA: "public, s-maxage=3600, stale-while-revalidate=86400",
  
  // Données semi-statiques (events, users) - 5 minutes avec revalidation
  SEMI_STATIC: "private, max-age=300, stale-while-revalidate=600",
  
  // Données dynamiques (notifications) - Pas de cache
  DYNAMIC: "no-cache, no-store, must-revalidate",
  
  // Données utilisateur spécifiques - Cache court avec revalidation
  USER_DATA: "private, max-age=60, stale-while-revalidate=120",
} as const;
