# Phase 3 — La vie de la prod (profiling, charge, cache)

> Palier « 1 000 000 d'utilisateurs » : efficience backend, cache, profiling continu.
> Cette phase combine du **code** (fait ici) et des **outils externes** (comptes Grafana
> Cloud / k6 Cloud + URL déployée) à exécuter pour produire les captures du rapport.

---

## 1. Stratégie de cache — Public (HIT) vs Privé (PASS/MISS)

Deux stratégies explicites ont été ajoutées dans [lib/cache-utils.ts](../../lib/cache-utils.ts) :

| Constante | Valeur | Usage |
|---|---|---|
| `PUBLIC_SHARED` | `public, s-maxage=3600, stale-while-revalidate=86400` | données identiques pour tous → **cache CDN partagé** |
| `PRIVATE_STRICT` | `private, no-store, max-age=0, must-revalidate` | données utilisateur → **jamais en cache partagé** |

### Routes de démonstration

| Route | Nature | Stratégie | Résultat CDN attendu |
|---|---|---|---|
| [`/api/stripe/pricing`](../../app/api/stripe/pricing/route.ts) | **Publique** (tarif identique pour tous) | `PUBLIC_SHARED` | `x-vercel-cache: HIT` (au 2ᵉ appel) |
| [`/api/auth/me`](../../app/api/auth/me/route.ts) | **Privée** (compte connecté) | `PRIVATE_STRICT` | `x-vercel-cache: MISS` / `PASS` |

### Preuve technique — en local (`next start`)

Le CDN n'existe pas en local, mais le header `Cache-Control` (la cause) est vérifiable :

```bash
# Publique → doit renvoyer "public, s-maxage=3600, stale-while-revalidate=86400"
curl -sI http://localhost:3000/api/stripe/pricing | grep -i cache-control

# Privée → doit renvoyer "private, no-store, max-age=0, must-revalidate"
curl -sI http://localhost:3000/api/auth/me | grep -i cache-control
```

#### Preuve locale obtenue (`npm run build && npm run start`)

```text
### ROUTE PRIVÉE /api/auth/me
HTTP/1.1 401 Unauthorized
cache-control: private, no-store, max-age=0, must-revalidate     ✅ PASS garanti

### CACHE APPLICATIF /api/stats?userId=1&period=month
appel 1 → HTTP 200 · x-app-cache: MISS   (requête DB + calculs)
appel 2 → HTTP 200 · x-app-cache: HIT    (servi du cache, 0 requête)
cache-control: private, max-age=300, s-maxage=30                 ✅ privé
```

> La route publique `/api/stripe/pricing` nécessite la clé Stripe (500 sans `.env`
> configuré) — son header `public` + `x-vercel-cache: HIT` est à capturer sur le déploiement.

### Preuve technique — en prod (Vercel)

```bash
# 1er appel : MISS, 2e appel : HIT (route publique)
curl -sI https://glyms-app.fr/api/stripe/pricing | grep -iE "cache-control|x-vercel-cache"
curl -sI https://glyms-app.fr/api/stripe/pricing | grep -i x-vercel-cache   # → HIT

# Route privée : toujours MISS/PASS quelle que soit la répétition
curl -sI https://glyms-app.fr/api/auth/me | grep -iE "cache-control|x-vercel-cache"
```

> 📸 **À capturer pour le rapport** : les deux sorties curl (Public HIT vs Privé PASS/MISS).

---

## 2. Fonction énergivore + cache applicatif

La route [`/api/stats`](../../app/api/stats/route.ts) est **volontairement lourde** : requête
Prisma profonde (tous les events + users + feedbacks + tags + preferences) puis nombreuses
agrégations CPU (taux de participation, distribution des notes, comptage de mots-clés, etc.).

**Optimisation** : un cache applicatif en mémoire à TTL ([lib/memory-cache.ts](../../lib/memory-cache.ts))
mémorise le résultat par `(userId, period, city)` pendant 60 s.
- 1er appel = **MISS** → requête DB + calculs (coûteux)
- appels suivants = **HIT** → aucune requête, aucun recalcul

Un header `X-App-Cache: HIT|MISS` est renvoyé pour prouver l'efficacité :

```bash
curl -sI "http://localhost:3000/api/stats?userId=1&period=month" | grep -i x-app-cache  # MISS
curl -sI "http://localhost:3000/api/stats?userId=1&period=month" | grep -i x-app-cache  # HIT
```

---

## 3. Profiling continu — Grafana Pyroscope

Instrumentation dans [server.mjs](../../server.mjs) (import dynamique + try/catch, opt-in).

### Étapes (compte externe requis)
1. Créer un compte **Grafana Cloud** → *Connections* → ajouter **Grafana Pyroscope**.
2. Récupérer *Send Profiles* → URL, User, Password.
3. Renseigner dans `.env.local` :
   ```env
   PYROSCOPE_ENABLED=true
   PYROSCOPE_SERVER_URL=https://profiles-prod-XXX.grafana.net
   PYROSCOPE_BASIC_AUTH_USER=xxxxxx
   PYROSCOPE_BASIC_AUTH_PASSWORD=xxxxxx
   ```
4. Lancer le serveur **hors terminal VSCode** (évite le crash natif pprof) :
   ```bash
   npm run build && NODE_ENV=production node server.mjs
   ```
   → log attendu : `Pyroscope started`.

> 📸 **À capturer** : Grafana → *Drilldown > Profiles* → Flamegraph + vue `CPU:wall`.

---

## 4. Test de charge — k6 Cloud

Script existant : [load-test.js](../../load-test.js) (cible `glyms-app.fr`).
Pour cibler la fonction énergivore et comparer avant/après cache :

```bash
# Local (k6 CLI) — avant/après le cache applicatif
k6 run -e BASE_URL=http://localhost:3000 load-test.js

# Cloud
k6 cloud load-test.js
```

Cible recommandée : `/api/stats?userId=…&period=month` (fonction énergivore) et/ou
`/api/cpu?ms=2000&token=…` (charge CPU contrôlée, cf. [app/api/cpu/route.ts](../../app/api/cpu/route.ts)).

> 📸 **À capturer** : rapport k6 Cloud (p95, RPS, CPU) + **lien** du run dans le rapport.

---

## 5. Mesure « Avant / Après » (à compléter avec vos chiffres)

| Indicateur | Avant | Après | Source |
|---|---|---|---|
| Temps CPU / requête `/api/stats` | _(MISS)_ | _(HIT)_ | Pyroscope CPU:wall |
| p95 latence sous charge | | | k6 Cloud |
| Requêtes DB / 1000 appels | ~1000 | ~(1000/60s de TTL) | X-App-Cache |
| Extrapolation | | « X ms × 1 000 000 vues = Y h CPU économisées » | calcul |

---

## Récap — code livré en Phase 3

| Fichier | Rôle |
|---|---|
| [lib/cache-utils.ts](../../lib/cache-utils.ts) | + stratégies `PUBLIC_SHARED` / `PRIVATE_STRICT` |
| [app/api/stripe/pricing/route.ts](../../app/api/stripe/pricing/route.ts) | route publique → HIT |
| [app/api/auth/me/route.ts](../../app/api/auth/me/route.ts) | route privée → PASS/MISS |
| [lib/memory-cache.ts](../../lib/memory-cache.ts) | cache applicatif TTL réutilisable |
| [app/api/stats/route.ts](../../app/api/stats/route.ts) | fonction énergivore + cache (`X-App-Cache`) |
| [app/api/cpu/route.ts](../../app/api/cpu/route.ts) | charge CPU contrôlée pour k6 (gate token) |
| [server.mjs](../../server.mjs) | Pyroscope fiabilisé (opt-in, try/catch, `NODE_ENV`) |
