/**
 * Node 22+ peut exposer un `globalThis.localStorage` incomplet (ex. `{}` sans getItem/setItem),
 * ce qui fait échouer le SSR Next.js dès qu'une dépendance ou un effet y touche.
 * Remplace par un stockage mémoire minimal côté process Node uniquement.
 */
export function patchBrokenNodeLocalStorage() {
  const g = globalThis;
  const ls = g.localStorage;
  const broken =
    ls != null &&
    (typeof ls.getItem !== "function" || typeof ls.setItem !== "function");
  if (!broken) return;

  const store = new Map();
  const storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.get(String(key)) ?? null;
    },
    key(index) {
      return [...store.keys()][Number(index)] ?? null;
    },
    removeItem(key) {
      store.delete(String(key));
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
  };

  try {
    delete g.localStorage;
  } catch {
    /* ignore */
  }

  Object.defineProperty(g, "localStorage", {
    value: storage,
    configurable: true,
    enumerable: true,
    writable: true,
  });
}
