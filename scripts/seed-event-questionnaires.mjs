// Seed des 4 catégories d'événement + questionnaires pondérés (remaster).
// Idempotent : les questionnaires des 4 catégories sont recréés à chaque exécution.
// Usage : node scripts/seed-event-questionnaires.mjs
import { config } from "dotenv";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
config();

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ───────────────────────────────────────────────────────────────────────────
// Contenu des questionnaires (fourni le 2026-07-09, tags Places API New).
// Corrections validées : cinema→movie_theater, skatepark→skateboard_park,
// museum_like_places→museum. "Peu importe" → allCategoryTags (+1 sur tous
// les tags de la catégorie, départage des ex æquo).
// ───────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: "Gastronomie",
    slug: "gastronomie",
    sortOrder: 1,
    questions: [
      {
        text: "Quel type d'expérience gastronomique te tente le plus ?",
        options: [
          { label: "Restaurant classique", weight: 3, tags: ["restaurant", "french_restaurant", "italian_restaurant"] },
          { label: "Street food / sur le pouce", weight: 3, tags: ["fast_food_restaurant", "hamburger_restaurant", "sandwich_shop", "pizza_restaurant"] },
          { label: "Cuisine du monde", weight: 3, tags: ["japanese_restaurant", "mexican_restaurant", "indian_restaurant", "lebanese_restaurant", "asian_restaurant"] },
          { label: "Pause sucrée / gourmande", weight: 3, tags: ["bakery", "dessert_shop", "ice_cream_shop", "chocolate_shop"] },
          { label: "Bar & apéro", weight: 3, tags: ["bar", "wine_bar", "pub", "bar_and_grill"] },
        ],
      },
      {
        text: "Quel moment / format préfères-tu ?",
        options: [
          { label: "Repas assis classique", weight: 2, tags: ["restaurant", "steak_house", "seafood_restaurant"] },
          { label: "Brunch / petit-déjeuner", weight: 2, tags: ["brunch_restaurant", "breakfast_restaurant", "cafe"] },
          { label: "Pause café / goûter", weight: 2, tags: ["coffee_shop", "tea_house", "cafe", "bakery"] },
          { label: "Apéro / soirée", weight: 2, tags: ["bar", "wine_bar", "pub"] },
          { label: "Peu importe", weight: 1, allCategoryTags: true, tags: [] },
        ],
      },
      {
        text: "Quelle ambiance te correspond le plus ?",
        options: [
          { label: "Chic & raffiné", weight: 2, tags: ["fine_dining_restaurant", "french_restaurant", "wine_bar"] },
          { label: "Convivial & animé", weight: 2, tags: ["bar_and_grill", "pub", "pizza_restaurant", "barbecue_restaurant"] },
          { label: "Cosy & tranquille", weight: 2, tags: ["cafe", "tea_house", "coffee_shop"] },
          { label: "Exotique & dépaysant", weight: 2, tags: ["japanese_restaurant", "thai_restaurant", "middle_eastern_restaurant", "indian_restaurant"] },
        ],
      },
      {
        text: "Côté assiette, tu privilégies quoi ?",
        multiSelect: true,
        maxChoices: 2,
        options: [
          { label: "Viande & grillades", weight: 3, tags: ["steak_house", "barbecue_restaurant", "bar_and_grill"] },
          { label: "Poisson & fruits de mer", weight: 3, tags: ["seafood_restaurant", "sushi_restaurant"] },
          { label: "Veggie / healthy", weight: 3, tags: ["vegetarian_restaurant", "vegan_restaurant", "juice_shop"] },
          { label: "Pizza & pasta", weight: 3, tags: ["pizza_restaurant", "italian_restaurant"] },
          { label: "Douceurs & desserts", weight: 3, tags: ["dessert_shop", "ice_cream_shop", "bakery", "chocolate_shop"] },
        ],
      },
      {
        text: "Qu'est-ce qui te motive le plus ?",
        options: [
          { label: "Découvrir de nouvelles saveurs", weight: 4, tags: ["asian_restaurant", "korean_restaurant", "vietnamese_restaurant", "lebanese_restaurant"] },
          { label: "Partager un bon moment d'équipe", weight: 4, tags: ["bar_and_grill", "pizza_restaurant", "pub"] },
          { label: "Me régaler sans compter", weight: 4, tags: ["fine_dining_restaurant", "steak_house", "seafood_restaurant"] },
          { label: "Souffler / me détendre", weight: 4, tags: ["cafe", "tea_house", "dessert_shop"] },
          { label: "Faire la fête autour d'un verre", weight: 4, tags: ["bar", "night_club", "wine_bar"] },
        ],
      },
    ],
  },
  {
    name: "Culture",
    slug: "culture",
    sortOrder: 2,
    questions: [
      {
        text: "Quel type d'expérience culturelle t'attire le plus ?",
        options: [
          { label: "Exposition artistique", weight: 3, tags: ["art_gallery", "art_studio", "sculpture"] },
          { label: "Découverte historique", weight: 3, tags: ["museum", "historical_place", "monument"] },
          { label: "Spectacle / représentation", weight: 3, tags: ["performing_arts_theater", "auditorium"] },
          { label: "Lieux emblématiques", weight: 3, tags: ["cultural_landmark", "monument"] },
        ],
      },
      {
        text: "Quelle durée idéale pour cette sortie ?",
        options: [
          { label: "Courte ( < 1h )", weight: 2, tags: ["art_gallery", "sculpture"] },
          { label: "Moyenne (1–2h)", weight: 2, tags: ["museum", "cultural_landmark"] },
          { label: "Longue (2h+)", weight: 2, tags: ["performing_arts_theater", "auditorium"] },
        ],
      },
      {
        text: "Tu préfères :",
        options: [
          { label: "Visite libre", weight: 2, tags: ["museum", "historical_place", "art_gallery"] },
          { label: "Visite guidée", weight: 2, tags: ["cultural_landmark", "monument"] },
          { label: "Spectacle organisé", weight: 2, tags: ["performing_arts_theater", "auditorium"] },
          { label: "Atelier participatif", weight: 3, tags: ["art_studio"] },
        ],
      },
      {
        text: "Tu te sens plus attiré par :",
        options: [
          { label: "L'histoire", weight: 2, tags: ["historical_place", "monument", "museum"] },
          { label: "L'art visuel", weight: 2, tags: ["art_gallery", "sculpture"] },
          { label: "La création", weight: 2, tags: ["art_studio"] },
          { label: "Le spectacle vivant", weight: 2, tags: ["performing_arts_theater", "auditorium"] },
        ],
      },
    ],
  },
  {
    name: "Divertissement",
    slug: "divertissement",
    sortOrder: 3,
    questions: [
      {
        text: "Quel type de divertissement te fait le plus envie ?",
        options: [
          { label: "Jeux & fun indoor", weight: 3, tags: ["bowling_alley", "video_arcade", "karaoke", "internet_cafe"] },
          { label: "Sensations fortes", weight: 3, tags: ["amusement_park", "roller_coaster", "adventure_sports_center", "water_park"] },
          { label: "Sortie nature détente", weight: 3, tags: ["park", "garden", "hiking_area", "botanical_garden", "picnic_ground"] },
          { label: "Culture & découverte", weight: 3, tags: ["planetarium", "aquarium", "zoo", "historical_landmark", "tourist_attraction"] },
          { label: "Soirée festive", weight: 3, tags: ["night_club", "dance_hall", "comedy_club", "concert_hall"] },
        ],
      },
      {
        text: "Tu préfères une activité plutôt…",
        options: [
          { label: "En intérieur", weight: 2, tags: ["bowling_alley", "video_arcade", "karaoke", "movie_theater", "planetarium", "internet_cafe"] },
          { label: "En extérieur", weight: 2, tags: ["park", "garden", "national_park", "skateboard_park", "hiking_area", "picnic_ground"] },
          { label: "Peu importe", weight: 1, allCategoryTags: true, tags: [] },
        ],
      },
      {
        text: "Quelle ambiance te correspond le plus ?",
        options: [
          { label: "Chill / détente", weight: 2, tags: ["garden", "dog_park", "observation_deck", "botanical_garden", "park"] },
          { label: "Ludique / gaming", weight: 2, tags: ["video_arcade", "bowling_alley", "internet_cafe"] },
          { label: "Spectacle / culture", weight: 2, tags: ["concert_hall", "opera_house", "amphitheatre", "philharmonic_hall"] },
          { label: "Festif / nocturne", weight: 2, tags: ["dance_hall", "night_club", "comedy_club"] },
          { label: "Nature & découverte", weight: 2, tags: ["hiking_area", "national_park", "wildlife_park", "wildlife_refuge"] },
        ],
      },
      {
        text: "Tu préfères une sortie :",
        options: [
          { label: "Active / dynamique", weight: 2, tags: ["skateboard_park", "off_roading_area", "cycling_park", "adventure_sports_center"] },
          { label: "Passive / contemplative", weight: 2, tags: ["aquarium", "zoo", "museum", "observation_deck"] },
          { label: "Sociale / conviviale", weight: 2, tags: ["barbecue_area", "banquet_hall", "community_center", "event_venue"] },
        ],
      },
      {
        text: "Qu'est-ce qui te motive le plus ?",
        options: [
          { label: "Rigoler & jouer ensemble", weight: 4, tags: ["bowling_alley", "karaoke", "video_arcade"] },
          { label: "Vivre des sensations fortes", weight: 4, tags: ["amusement_park", "roller_coaster", "water_park"] },
          { label: "Déconnecter dans la nature", weight: 4, tags: ["hiking_area", "national_park", "wildlife_park"] },
          { label: "Découvrir / apprendre", weight: 4, tags: ["aquarium", "planetarium", "zoo", "historical_landmark"] },
          { label: "Faire la fête", weight: 4, tags: ["night_club", "comedy_club", "dance_hall", "concert_hall"] },
        ],
      },
    ],
  },
  {
    name: "Sport",
    slug: "sport",
    sortOrder: 4,
    questions: [
      {
        text: "Quel type d'effort préfères-tu ?",
        options: [
          { label: "Cardio / Endurance", weight: 2, tags: ["fitness_center", "gym", "athletic_field"] },
          { label: "Doux / Relax", weight: 2, tags: ["swimming_pool", "fishing_pond", "sports_activity_location"] },
          { label: "Adrénaline / Fun", weight: 2, tags: ["ice_skating_rink", "ski_resort", "arena"] },
          { label: "Sport collectif", weight: 2, tags: ["sports_club", "stadium", "sports_complex"] },
          { label: "Technique / Ciblé", weight: 2, tags: ["sports_coaching", "golf_course"] },
        ],
      },
      {
        text: "Tu aimerais faire cette activité :",
        options: [
          { label: "En intérieur", weight: 2, tags: ["gym", "fitness_center", "sports_complex", "arena", "ice_skating_rink"] },
          { label: "En extérieur", weight: 2, tags: ["athletic_field", "golf_course", "fishing_pond", "playground"] },
          { label: "En nature", weight: 2, tags: ["ski_resort", "fishing_charter", "fishing_pond"] },
          { label: "Peu importe", weight: 1, allCategoryTags: true, tags: [] },
        ],
      },
      {
        text: "Tu préfères une activité :",
        options: [
          { label: "Très dynamique", weight: 2, tags: ["arena", "sports_complex", "stadium"] },
          { label: "Modérée", weight: 2, tags: ["sports_club", "gym", "swimming_pool"] },
          { label: "Très chill", weight: 2, tags: ["fishing_pond", "fishing_charter", "playground"] },
        ],
      },
      {
        text: "Quel format d'activité t'attire le plus ?",
        multiSelect: true,
        maxChoices: 2,
        options: [
          { label: "Sport en équipe", weight: 3, tags: ["sports_club", "stadium", "sports_complex"] },
          { label: "Sport individuel", weight: 3, tags: ["gym", "fitness_center", "golf_course"] },
          { label: "Activité ludique", weight: 3, tags: ["ice_skating_rink", "playground"] },
          { label: "Activité bien-être", weight: 3, tags: ["swimming_pool", "sports_activity_location"] },
          { label: "Activité de pleine nature", weight: 3, tags: ["fishing_charter", "fishing_pond", "ski_resort"] },
        ],
      },
      {
        text: "Qu'est-ce qui te motive le plus ?",
        options: [
          { label: "Se dépasser physiquement", weight: 4, tags: ["athletic_field", "gym", "fitness_center"] },
          { label: "S'amuser sans pression", weight: 4, tags: ["playground", "ice_skating_rink"] },
          { label: "Déconnecter / se détendre", weight: 4, tags: ["fishing_pond", "swimming_pool"] },
          { label: "Vivre une expérience rare", weight: 4, tags: ["fishing_charter", "ski_resort"] },
          { label: "Apprendre ou progresser", weight: 4, tags: ["sports_coaching", "sports_club"] },
        ],
      },
    ],
  },
];

async function main() {
  // 1) Upsert des tags Google Places référencés par les questionnaires
  const allTechNames = new Set();
  for (const category of CATEGORIES) {
    for (const question of category.questions) {
      for (const option of question.options) {
        option.tags.forEach((t) => allTechNames.add(t));
      }
    }
  }

  const tagIdByTechName = new Map();
  for (const techName of allTechNames) {
    const tag = await prisma.googleTag.upsert({
      where: { techName },
      update: { isActive: true },
      create: { techName, source: "questionnaire", isActive: true },
    });
    tagIdByTechName.set(techName, tag.id);
  }
  console.log(`✔ ${allTechNames.size} tags Google Places présents (upsert)`);

  // 2) Catégories + questionnaires (recréés pour rester idempotent)
  for (const category of CATEGORIES) {
    const cat = await prisma.eventCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder, isActive: true },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
      },
    });

    await prisma.categoryQuestion.deleteMany({ where: { categoryId: cat.id } });

    let qOrder = 0;
    for (const question of category.questions) {
      qOrder += 1;
      const createdQuestion = await prisma.categoryQuestion.create({
        data: {
          categoryId: cat.id,
          text: question.text,
          sortOrder: qOrder,
          multiSelect: question.multiSelect ?? false,
          maxChoices: question.maxChoices ?? 1,
        },
      });

      let oOrder = 0;
      for (const option of question.options) {
        oOrder += 1;
        await prisma.questionOption.create({
          data: {
            questionId: createdQuestion.id,
            label: option.label,
            weight: option.weight,
            allCategoryTags: option.allCategoryTags ?? false,
            sortOrder: oOrder,
            tags: {
              create: option.tags.map((techName) => ({
                tagId: tagIdByTechName.get(techName),
              })),
            },
          },
        });
      }
    }
    console.log(
      `✔ ${category.name} : ${category.questions.length} questions, ${category.questions.reduce((n, q) => n + q.options.length, 0)} options`,
    );
  }

  // 3) Contrôle final
  const counts = await prisma.eventCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      name: true,
      _count: { select: { questions: true } },
    },
  });
  console.log(
    "Résumé :",
    counts.map((c) => `${c.name}=${c._count.questions}q`).join(", "),
  );
}

main()
  .catch((err) => {
    console.error("Erreur seed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
