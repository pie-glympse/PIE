# Phase 2 — Optimisations (paliers MVP + 10k)

> Implémentation des optimisations identifiées dans l'audit baseline
> ([01-audit-baseline.md](./01-audit-baseline.md)). Branche `ecoconception-audit`,
> un commit dédié par changement.

## Résumé des gains « avant / après »

| Métrique | Avant | Après | Gain |
|---|---|---|---|
| **`public/` (assets statiques)** | **15 Mo** | **4,1 Mo** | **−73 %** |
| PNG > 100 Ko (17 fichiers) | 11,43 Mo | 1,00 Mo | **−91 %** |
| Dépendances prod (`package.json`) | 30 | 25 | −5 (−1 native `bcrypt`) |
| Build de prod | ❌ cassé | ✅ 70 pages | réparé |
| Fichiers morts (templates + scaffold + singleton) | 8 fichiers | 0 | supprimés |
| First Load JS partagé | 102 kB | 102 kB | stable (deps mortes = côté serveur) |

Le JS critique était déjà maîtrisé → le gain majeur est **réseau/bande passante** (images) et
**dette/cold-start** (dépendances).

## Détail par commit

| Commit | Type | Contenu |
|---|---|---|
| `resync package-lock` | fix | `node_modules` périmé → build réparé |
| `perf: supprime le poids mort` | deps | retire `next-auth`, `resend`, `@auth/prisma-adapter`, `@react-email/*`, `bcrypt` (0 usage) ; déclare `jose` + `dotenv` (utilisées mais transitives) ; supprime templates email obsolètes, scaffold `react-email-starter/`, `lib/prisma-singleton.ts` |
| `refactor(auth): bcryptjs` | refactor | unifie le hashage sur `bcryptjs`, retire le natif `bcrypt` (évite la compilation `node-gyp`, allège les cold starts serverless) |
| `perf(images)` | assets | resize des PNG 4K (jusqu'à 4000×4000) vers 1400 px (héro) / 768 px (reste) + recompression, transparence préservée |
| `perf(a11y): next/image` | frontend | migre les 2 derniers `<img>` bruts (`ranking`) vers `next/image` (AVIF/WebP + lazy-load auto) |

### Détail images (les pires offenseurs)

| Fichier | Dimensions | Poids avant → après |
|---|---|---|
| `mascotte/login-light.png` | 2928×4096 → 1001×1400 | 3682 → 176 Ko (**−95 %**) |
| `mascotte/login.png` | 2952×4056 → 1019×1400 | 3081 → 164 Ko (−95 %) |
| `badges/badge_peacemaker.png` | 4000×4000 → 768×768 | 774 → 39 Ko (−95 %) |
| `badges/badge_star.png` | 3000×3000 → 768×768 | 522 → 26 Ko (−95 %) |
| … 13 autres | — | −66 % à −92 % |

> Ces images étaient exportées en 4K pour un affichage `≤ 45vw` (≈ 1150 px sur grand écran) —
> gaspillage de bande passante **et** de CPU serveur (Next devait transformer 12 Mpx à chaque
> variante). Corrigé à la source.

## Reste à traiter (Phase 2 bis / Phase 3)

- [ ] `mascotte/night_work.svg` (2,5 Mo, SVG à raster embarqué, page 404) — non traité (risque/faible trafic).
- [ ] Double config Tailwind : `tailwind.config.js` + `.ts` sont **ignorés** en Tailwind v4
      (config via `@theme` dans `globals.css`, aucune directive `@config`) → à supprimer proprement.
- [ ] Middleware ~40 kB exécuté à chaque requête → piste d'allègement (palier 1M).
- [ ] Audits navigateur (Lighthouse / EcoIndex / Axe / Coverage) « après » à recapturer pour le rapport.

## RGESN couvert par cette phase

- **Contenus** : formats/poids des médias, compression, dimensions adaptées à l'affichage.
- **Architecture / Spécifications** : mutualisation des dépendances, suppression du code mort.
- **Frontend** : `next/image` généralisé (lazy-load, formats modernes).
