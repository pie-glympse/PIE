/**
 * Cache applicatif en mémoire (TTL) — écoconception / perf backend.
 *
 * Objectif : éviter de recalculer des réponses coûteuses (grosses requêtes DB +
 * agrégations CPU) à chaque appel. Sur un serveur long-running (server.mjs), le
 * cache est pleinement efficace ; en serverless il l'est sur les instances chaudes
 * (typiquement pendant un pic de charge / un test k6).
 *
 * Volontairement minimal (Map + expiration) : pas de dépendance externe à charger.
 */

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();

// Compteurs d'observabilité (exposables pour prouver l'efficacité du cache).
const stats = { hits: 0, misses: 0 };

/**
 * Récupère une valeur en cache ou la calcule via `compute` puis la mémorise.
 * @param key   clé de cache (doit inclure tous les paramètres qui changent le résultat)
 * @param ttlMs durée de vie en millisecondes
 * @param compute fonction (async) qui produit la valeur en cas de miss
 */
export async function getOrSet<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> {
  const now = Date.now();
  const cached = store.get(key) as Entry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    stats.hits++;
    return { value: cached.value, hit: true };
  }

  stats.misses++;
  const value = await compute();
  store.set(key, { value, expiresAt: now + ttlMs });
  return { value, hit: false };
}

/** Invalide une clé (ex: après une mutation qui change les données). */
export function invalidate(key: string): void {
  store.delete(key);
}

/** Statistiques hits/misses (pour /api/health ou une preuve d'efficacité). */
export function getCacheStats() {
  const total = stats.hits + stats.misses;
  return {
    ...stats,
    hitRate: total > 0 ? Math.round((stats.hits / total) * 1000) / 10 : 0,
    size: store.size,
  };
}
