# Phase 1 — Audit baseline (écoconception)

> Mesures de référence prises **avant** toute optimisation, sur la branche `ecoconception-audit`.
> Objectif : disposer d'un point de comparaison chiffré pour prouver les gains (Ko / CPU / scores).
>
> Date : 2026-07-06 · Next.js 15.3.8 · build de production (`npm run build`).

---

## 0. Constat préalable — le build de prod était cassé

`npm run build` **échouait** au départ (webpack "Module not found" sur `stripe`, `react-icons`,
`@getbrevo/brevo`). Ces 3 paquets étaient pourtant **déclarés dans `package.json`** : la cause
était un `node_modules` **périmé** (installé le 16 juin, manifeste mis à jour le 6 juillet).

`npm install` (resync) suffit → le build passe (70 pages générées). Seul `package-lock.json`
est modifié (+9 lignes de résolution).

➡️ **Finding #0** : `node_modules` désynchronisé du manifeste — le build local ne compilait pas
tant qu'on n'avait pas réinstallé. À fiabiliser côté process (CI `npm ci`, hook post-merge).

---

## 1. Poids des bundles JS (First Load JS)

Bon point de départ : le **JS critique est déjà maîtrisé**. Les libs lourdes (FullCalendar,
Google Maps, Chart.js) ne plombent pas le First Load JS → elles sont chargées par route/à la demande.

- **Shared par toutes les pages : 102 kB** (2 chunks : 46,1 kB + 53,2 kB)
- **Middleware : 37,8 kB** (s'exécute à chaque requête → cible d'optimisation)

Pages les plus lourdes (First Load JS) :

| Route | Size page | First Load JS |
|---|---|---|
| `/settings` | 17,5 kB | **125 kB** |
| `/events/[id]` | 11,5 kB | 121 kB |
| `/create-event` | 8,97 kB | 120 kB |
| `/events` | 7,73 kB | 118 kB |
| `/home` | 5,1 kB | 118 kB |
| Majorité des pages | — | 102–113 kB |

➡️ **Le gisement principal n'est PAS le JS mais les images** (voir §3).

## 2. Dépendances — poids mort & doublons (vérifié manuellement, hors faux positifs depcheck)

**Dépendances déclarées mais réellement mortes (0 occurrence dans le code) :**

| Paquet | Occurrences | Origine probable |
|---|---|---|
| `next-auth` | 0 | remplacé par auth JWT custom (`lib/auth.ts` + `jose`) |
| `resend` | 0 | remplacé par la migration Brevo |
| `@react-email/render` | 0 | idem migration Brevo |
| `@auth/prisma-adapter` | 0 | reliquat next-auth |

**Doublons / redondances :**

| Cas | Détail | Action Phase 2 |
|---|---|---|
| `bcrypt` (natif) vs `bcryptjs` | `bcrypt` → 1 fichier ; `bcryptjs` → 5 fichiers | supprimer `bcrypt` natif (évite `node-gyp`/`@napi-rs`), garder `bcryptjs` |
| 2 singletons Prisma | `lib/prisma.ts` → **55 imports** ; `lib/prisma-singleton.ts` → **0 import** | supprimer `prisma-singleton.ts` (code mort) |
| 2 configs Tailwind | `tailwind.config.js` + `tailwind.config.ts` | garder une seule |
| 2 inits Pyroscope | `server.mjs` (Grafana Cloud) + `pyroscope.ts` (localhost) | clarifier / unifier |

**Dépendances utilisées mais NON déclarées** (fragile — marchent en transitif) :
`jose` (4 fichiers auth), `dotenv` (1 fichier) → à ajouter explicitement au `package.json`.

> Note : depcheck signale aussi eslint/postcss/autoprefixer/jest-environment-jsdom comme "devDeps
> inutilisées" → **faux positifs** (utilisés via config, pas via `import`). Non retenus.

## 3. Assets — le gisement n°1

`public/` ≈ **15 Mo** · PNG **12 Mo** · SVG 2,6 Mo · JPG 104 Ko · **19 fichiers > 100 Ko**.

Problème majeur : des mascottes décoratives exportées en **résolution 4K**, servies pour un
affichage de quelques centaines de px :

| Fichier | Poids | Dimensions réelles |
|---|---|---|
| `mascotte/login-light.png` | 3,6 Mo | **2928 × 4096** (~12 Mpx) |
| `mascotte/login.png` | 3,1 Mo | **2952 × 4056** |
| `badges/badge_peacemaker.png` | 792 Ko | **4000 × 4000** |
| `mascotte/night_work.svg` | 2,5 Mo | SVG avec raster embarqué |

➡️ **Action Phase 2 (palier 10k)** : redimensionner à la taille d'affichage + WebP/AVIF.
`next.config.ts` sort déjà en AVIF/WebP via `next/image`, mais transforme quand même les
originaux 4K → énorme gaspillage CPU + bande passante à corriger à la source.

Frontend : 27 fichiers utilisent `next/image`, **2 balises `<img>` brutes** restent
(`app/ranking/page.tsx:173` et `:236`) → à migrer (perf + a11y).

## 4. Audits navigateur — à capturer (screenshots requis pour le rapport)

Ces audits nécessitent un navigateur et servent de preuves visuelles dans le rapport PDF :

- [ ] **Lighthouse** (DevTools > Lighthouse) sur `home`, `events`, `stats`, `login` — noter
      Performance / Accessibilité / Best Practices + LCP, TBT, CLS.
- [ ] **EcoIndex.fr** sur les mêmes pages — noter la note (A–G), g CO₂e, eau.
- [ ] **Axe DevTools / WAVE** — a11y : contrastes, landmarks (`role`/`<nav>`/`<article>` peu
      présents), les 2 `<img>` sans `next/image`.
- [ ] **Coverage** (DevTools > Coverage) — % de JS/CSS non utilisé sur le premier rendu.

---

## Synthèse — plan d'action Phase 2 (priorisé par impact)

| # | Action | Gisement | Effort | Partie rapport |
|---|---|---|---|---|
| 1 | Redimensionner + WebP/AVIF les PNG 4K (mascottes/badges) | ~10 Mo → estim. <1 Mo | M | 2 · 10 |
| 2 | Supprimer 4 deps mortes (next-auth, resend, @react-email/render, @auth/prisma-adapter) | poids install / lock | S | 2 |
| 3 | Consolider bcrypt → bcryptjs (retirer natif) | build + node_modules | S | 2 |
| 4 | Supprimer `lib/prisma-singleton.ts` (code mort) + doublon Tailwind | dette | S | 2 |
| 5 | Déclarer `jose`, `dotenv` ; fiabiliser `node_modules`/CI | robustesse build | S | 2 |
| 6 | Migrer les 2 `<img>` bruts → `next/image` | a11y + perf | S | 4 |
| 7 | Alléger le middleware (37,8 kB) | JS par requête | M | 3 |
