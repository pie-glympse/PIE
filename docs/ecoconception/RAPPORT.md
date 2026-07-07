# Rapport d'Optimisation Écoconception — Glyms (PIE)

> **Document de travail / passation.** Ce fichier assemble le rapport final attendu
> (plan en 12 parties). Les **Parties Introduction → 6 sont rédigées** ci-dessous à partir
> du travail réalisé (branche `ecoconception-audit`). Les **Parties 7 → 12** et les
> **captures d'outils navigateur/cloud** restent à produire — voir la section
> [« Ce qui reste à faire »](#ce-qui-reste-à-faire-passation) à la fin.
>
> Sources détaillées : [01-audit-baseline.md](./01-audit-baseline.md) ·
> [02-phase2-optimisations.md](./02-phase2-optimisations.md) ·
> [03-vie-de-la-prod.md](./03-vie-de-la-prod.md).
>
> Légende : ✅ fait/mesuré · 🟡 partiel · ⚠️ **MANQUE — à produire par la personne qui reprend**.

---

## Introduction

**Le service.** Glyms (nom de code repo : *PIE*) est une application web de planification
d'événements d'équipe en entreprise : création d'événements, sondages de préférences,
constitution de groupes, suggestions de lieux (Google Places), gamification (points/badges),
statistiques, facturation (Stripe) et notifications e-mail (Brevo).

**Stack.** Next.js 15.3.8 (App Router) · React 19 · TypeScript · Prisma 7 / PostgreSQL
(Supabase) · Tailwind v4 · déploiement Vercel. Backend = ~40 routes API (`app/api/*`).
Un serveur custom `server.mjs` permet le profiling continu (Pyroscope).

**Justification du choix (Option A).** Projet développé par l'équipe : codebase maîtrisée,
liberté totale de modification, et surtout **backend réel** + infra de profiling déjà amorcée
(Pyroscope, route CPU) → permet de traiter les 3 paliers de l'exercice (10 → 10 000 → 1 000 000
utilisateurs), y compris la partie infrastructure.

**Périmètre audité.** Pages clés : `home`, `events`, `stats`, `login`, `ranking`, `pricing`,
`settings`. Côté backend : routes `/api/stats` (énergivore), `/api/stripe/pricing` (publique),
`/api/auth/me` (privée).

**Critères RGESN retenus comme fil rouge** (thématiques différentes, cf. exigence Partie 11) :

| # | Thématique RGESN | Critère (formulation) | Traité en |
|---|---|---|---|
| 1 | Stratégie | Revue de la pertinence des fonctionnalités (sobriété fonctionnelle) | Partie 5 |
| 2 | Architecture / Spécifications | Mutualisation & suppression des dépendances/code inutiles | Partie 2 |
| 3 | Contenus | Formats et poids des médias adaptés à l'affichage | Parties 2/7 |
| 4 | Frontend | Réduction du poids et du code non exécuté (JS/CSS) | Parties 1/2 |
| 5 | Backend / Hébergement | Stratégie de cache et efficience des traitements serveur | Parties 8/9 |

> ⚠️ Mapper ces critères aux **numéros exacts du RGESN** (version en vigueur) avant remise.

---

## Partie 1 — Audit Webperf Initial

### 1.1 Poids des bundles (build de production) ✅

Mesuré via `next build`. Le **JS critique est déjà maîtrisé** — les libs lourdes
(FullCalendar, Google Maps, Chart.js) ne sont pas dans le bundle partagé.

- **First Load JS partagé : 102 kB** (2 chunks : 46,1 + 53,2 kB)
- **Middleware : ~40 kB** (exécuté à chaque requête → piste d'allègement)
- Pages les plus lourdes : `/settings` 125 kB · `/events/[id]` 121 kB · `/create-event` 120 kB
- Majorité des pages : 102–113 kB

### 1.2 Lighthouse & EcoIndex ⚠️ **MANQUE**

À réaliser dans le navigateur (screenshots exigés) sur `home`, `events`, `stats`, `login` :
- **Lighthouse** (DevTools) : Performance / Accessibilité / Best Practices + LCP, TBT, CLS.
- **EcoIndex.fr** (ou extension GreenIT-Analysis) : note A–G, score /100, g CO₂e, eau.

> Tableau à remplir :
> | Page | Perf | A11y | LCP | EcoIndex (note) | Poids page |
> |------|------|------|-----|-----------------|------------|
> | home | | | | | |
> | events | | | | | |
> | stats | | | | | |
> | login | | | | | |

---

## Partie 2 — Analyse des Dépendances et du « Poids Mort » ✅

### 2.1 Constat bloquant — build cassé au départ ✅
`node_modules` était **désynchronisé** du manifeste (installé le 16/06, manifeste modifié le
06/07) → `npm run build` échouait (`stripe`, `react-icons`, `@getbrevo/brevo` manquants).
Correctif : `npm install`. *Finding process : imposer `npm ci` en CI.*

### 2.2 Dépendances mortes (0 usage vérifié) ✅

| Paquet | Origine | Action |
|---|---|---|
| `next-auth`, `@auth/prisma-adapter` | remplacés par auth JWT custom (`jose`) | supprimés |
| `resend`, `@react-email/render`, `@react-email/components` | remplacés par Brevo | supprimés |
| `bcrypt` (natif) | doublon de `bcryptjs` (1 vs 5 usages) | supprimé (fin de la compilation node-gyp) |

Fichiers morts supprimés : 2 templates e-mail react-email, le scaffold `react-email-starter/`
(4 e-mails de démo), `lib/prisma-singleton.ts` (0 import sur 55 pour `lib/prisma.ts`).
Dépendances utilisées mais non déclarées (fragile) **corrigées** : `jose`, `dotenv`.

**Résultat : dépendances prod 30 → 25**, arbre allégé, cold starts serverless réduits.

### 2.3 Poids mort des assets ✅
`public/` = 15 Mo, dont **12 Mo de PNG** exportés en 4K (jusqu'à 4000×4000) pour un affichage
≤ 45vw. Voir Partie 7 pour l'optimisation (résultat : **15 Mo → 4,1 Mo**).

### 2.4 Coverage (JS/CSS non utilisé) ⚠️ **MANQUE**
À capturer via DevTools > Coverage sur les pages clés (% unused par fichier) — preuve visuelle
du poids mort côté client.

---

## Partie 3 — Profiling Applicatif et Analyse Runtime 🟡

### 3.1 Identification de la fonction énergivore ✅
Analyse du code : la route [`/api/stats`](../../app/api/stats/route.ts) est le point chaud —
requête Prisma profonde (tous les events + users + feedbacks + tags + preferences) suivie de
nombreuses agrégations CPU en mémoire (taux de participation, distribution des notes,
comptage de mots-clés des commentaires, évolution mensuelle…). Cible idéale pour le profiling.

Une seconde cible de charge **contrôlée** existe : [`/api/cpu`](../../app/api/cpu/route.ts)
(boucle CPU paramétrable, protégée par token en prod).

### 3.2 Profils Pyroscope / DevTools Performance ⚠️ **MANQUE**
Instrumentation prête (`server.mjs`, opt-in). Reste à **capturer** :
- Flamegraph **avant/après** et vue **CPU:wall** dans Grafana (Drilldown > Profiles).
- (option) onglet **Performance** des DevTools sur la page `stats`.

Méthodo complète (env, commandes) : [03-vie-de-la-prod.md](./03-vie-de-la-prod.md) §3.

---

## Partie 4 — Audit d'Accessibilité Approfondi 🟡

### 4.1 Signaux relevés dans le code ✅
- `<html lang="fr">` présent · polices `next/font` avec `display: swap` (pas de CLS).
- `alt` : 53 occurrences · `aria-*` : 32 · **landmarks faibles** (`role` : 4, `<nav>` : 1,
  `<article>` : 0) → sémantique de navigation à renforcer.
- **Corrigé** : les 2 dernières balises `<img>` brutes (`ranking`) migrées vers `next/image`.

### 4.2 Axe / WAVE ⚠️ **MANQUE**
Scan à réaliser (screenshots) sur `home`, `events`, `stats`, `login`, `ranking` :
nombre de violations par gravité (critical/serious/moderate), contrastes, ordre de tabulation
clavier, labels de formulaires. Vérifs manuelles : navigation 100 % clavier, focus visible.

---

## Partie 5 — Sobriété Fonctionnelle et UX/UI 🟡

### 5.1 Cartographie fonctionnelle ✅
~23 pages : parcours auth (login/register/forgot/reset/set-password/greetings), cœur
événementiel (events, create/edit-event, event-preferences, answer-event, create-groups),
social/gamification (ranking, stats, notifications, profile, settings), marketing (pricing,
contact-us), back-office (office/*). Page `styleguide` = interne (à exclure de la prod).

### 5.2 Pistes de sobriété identifiées 🟡
- **Gamification** (points/badges, effet `react-parallax-tilt` sur 1 page) : évaluer le rapport
  valeur/coût (JS + images de badges) — candidat à discussion de sobriété fonctionnelle.
- **Widgets lourds** : FullCalendar, Google Maps, Chart.js — vérifier qu'ils sont chargés
  uniquement là où nécessaire (lazy) et proposer des alternatives légères si l'usage est marginal.
- **Page 404** charge `night_work.svg` (2,5 Mo) — disproportionné (voir reste à faire).

> ⚠️ À compléter : analyse UX des parcours (nombre d'étapes, champs de formulaire superflus),
> revue éditoriale des contenus. Partie en partie subjective → à argumenter dans le PDF.

---

## Partie 6 — Synthèse des Audits & Plan d'Action ✅

### 6.1 Synthèse

| Domaine | Constat | Gravité | Statut |
|---|---|---|---|
| Build | node_modules périmé → build cassé | Haute | ✅ corrigé |
| Dépendances | 6 deps mortes + doublons (bcrypt, Prisma, Tailwind) | Moyenne | ✅ majoritairement corrigé |
| Assets images | PNG 4K = 12 Mo | **Haute** (réseau) | ✅ corrigé (−91 %) |
| JS critique | déjà sain (102 kB) | Faible | — |
| Backend | fonction `/api/stats` énergivore, pas de cache | Haute | ✅ cache applicatif ajouté |
| Cache HTTP | pas de distinction Public/Private | Moyenne | ✅ implémenté |
| Accessibilité | landmarks faibles, à auditer | Moyenne | 🟡 partiel |
| Profiling | à capturer (Grafana/k6) | — | ⚠️ manque |

### 6.2 Plan d'action (priorisé par impact / effort)

| # | Action | Palier | Impact | Statut |
|---|---|---|---|---|
| 1 | Optimiser les images 4K (resize + WebP/AVIF) | 10k | ~11 Mo économisés | ✅ |
| 2 | Supprimer deps + code mort | MVP | dette / cold start | ✅ |
| 3 | Cache applicatif sur `/api/stats` | 1M | CPU/DB par requête | ✅ |
| 4 | Cache HTTP Public (HIT) vs Privé (PASS/MISS) | 1M | bande passante / sécurité | ✅ |
| 5 | Profiling continu Pyroscope + charge k6 | 1M | mesure | ⚠️ captures |
| 6 | Audits navigateur (Lighthouse/EcoIndex/Axe/Coverage) | tous | preuves | ⚠️ captures |
| 7 | Renforcer l'accessibilité (landmarks, clavier) | MVP | a11y | 🟡 à faire |
| 8 | Alléger middleware (~40 kB) + `night_work.svg` (2,5 Mo) | 10k/1M | perf | ⬜ backlog |

---

## Ce qui reste à faire (passation)

**Parties 7 → 12 du rapport** (matière déjà disponible dans les docs 02 et 03) :
- **Partie 7 — Implémentation** : extraits de code + liens commits. Tous les commits sont sur la
  branche `ecoconception-audit` (préfixes `perf/`, `feat/`, `refactor/`, `docs/`). Résumé dans
  [02-phase2-optimisations.md](./02-phase2-optimisations.md) et [03-vie-de-la-prod.md](./03-vie-de-la-prod.md).
- **Partie 8 — La vie de la prod** : ⚠️ **captures Grafana (Flamegraph, CPU:wall) + rapport/lien
  k6 Cloud**. Instrumentation et cible prêtes ; il faut les comptes + le run.
- **Partie 9 — Stratégie de cache** : preuves headers. Preuve locale déjà obtenue (Private
  no-store + `X-App-Cache` MISS→HIT) ; ⚠️ **capturer `x-vercel-cache: HIT` sur le déploiement**.
- **Partie 10 — Impact Avant/Après** : chiffrer (images ✅ ; ⚠️ **CPU/latence via k6+Pyroscope** ;
  extrapolation « X ms × 1 000 000 vues »).
- **Partie 11 — Pistes RGESN futures** : ≥ 4-5 recommandations de thématiques différentes
  (ex : middleware, night_work.svg, lazy-load des widgets, sobriété gamification, a11y landmarks).
- **Partie 12 — Conclusion & apprentissages**.

**Captures/mesures manquantes à produire (récap) :**
1. ⚠️ Lighthouse (4 pages) — Partie 1
2. ⚠️ EcoIndex (4 pages) — Partie 1
3. ⚠️ DevTools Coverage — Partie 2
4. ⚠️ Axe/WAVE (5 pages) — Partie 4
5. ⚠️ Grafana Pyroscope Flamegraph + CPU:wall avant/après — Parties 3/8/10
6. ⚠️ k6 Cloud (run + lien) sur `/api/stats` avant/après cache — Parties 8/10
7. ⚠️ `x-vercel-cache: HIT` sur le déploiement — Partie 9

**Nettoyages techniques restants (optionnels) :**
- Double config Tailwind (`tailwind.config.js` + `.ts`) — **ignorées** en Tailwind v4 (config
  via `@theme` dans `globals.css`) → supprimer les deux fichiers après vérification.
- `mascotte/night_work.svg` (2,5 Mo, page 404) — ré-exporter / remplacer.
- Middleware ~40 kB — analyser ce qui est embarqué.

**Comment reprendre :** la méthodo pas-à-pas (env, commandes curl/k6, emplacements des
captures 📸) est dans [03-vie-de-la-prod.md](./03-vie-de-la-prod.md). Les chiffres « avant »
sont dans [01-audit-baseline.md](./01-audit-baseline.md).
