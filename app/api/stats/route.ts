import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateETag, isNotModified, addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "all"; // week, month, quarter, year, all
    const activityType = searchParams.get("activityType");
    const city = searchParams.get("city");

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    const userIdBigInt = BigInt(userId);

    // Construire les filtres de date
    const now = new Date();
    let dateFilter: { gte?: Date } = {};

    switch (period) {
      case "week":
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter.gte = weekAgo;
        break;
      case "month":
        dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        dateFilter.gte = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        dateFilter.gte = new Date(now.getFullYear(), 0, 1);
        break;
      // "all" ne nécessite pas de filtre
    }

    // Construire le where pour les événements
    const where: any = {
      createdById: userIdBigInt,
    };

    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    if (activityType) {
      where.activityType = activityType;
    }

    if (city) {
      where.city = city;
    }

    // Récupérer tous les événements créés par l'utilisateur
    const events = await prisma.event.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        feedbacks: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        preferences: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (events.length === 0) {
      return NextResponse.json({
        hasEvents: false,
        message: "Vous n'avez pas encore créé d'événement",
      });
    }

    // Calculer les statistiques globales
    const totalEvents = events.length;
    const totalParticipants = new Set(
      events.flatMap((e) => e.users.map((u) => u.id.toString()))
    ).size;

    // Calculer le taux de participation moyen
    const participationRates = events.map((event) => {
      const maxPersons = event.maxPersons ? Number(event.maxPersons) : null;
      const actualParticipants = event.users.length;
      if (maxPersons && maxPersons > 0) {
        return (actualParticipants / maxPersons) * 100;
      }
      return actualParticipants > 0 ? 100 : 0;
    });
    const avgParticipationRate =
      participationRates.reduce((a, b) => a + b, 0) / participationRates.length;

    // Calculer la note moyenne
    const allRatings = events
      .flatMap((e) => e.feedbacks)
      .filter((f) => f.rating !== null)
      .map((f) => Number(f.rating));
    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;

    // Top 3 des types d'activités
    const activityTypeCounts: Record<string, number> = {};
    events.forEach((event) => {
      if (event.activityType) {
        activityTypeCounts[event.activityType] =
          (activityTypeCounts[event.activityType] || 0) + 1;
      }
    });
    const topActivities = Object.entries(activityTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // Top 3 des tags
    const tagCounts: Record<string, number> = {};
    events.forEach((event) => {
      event.tags.forEach((tag) => {
        tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // Statistiques de participation
    const totalInvitations = events.reduce(
      (sum, event) => sum + event.preferences.length,
      0
    );
    const totalResponses = events.reduce(
      (sum, event) => sum + event.users.length,
      0
    );
    const responseRate =
      totalInvitations > 0 ? (totalResponses / totalInvitations) * 100 : 0;

    // Distribution des notes
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    allRatings.forEach((rating) => {
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as keyof typeof ratingDistribution]++;
      }
    });

    // Total de feedbacks
    const totalFeedbacks = events.reduce(
      (sum, event) => sum + event.feedbacks.length,
      0
    );

    // Événements les mieux notés
    const eventsWithRatings = events
      .map((event) => {
        const eventRatings = event.feedbacks
          .filter((f) => f.rating !== null)
          .map((f) => Number(f.rating));
        const avgEventRating =
          eventRatings.length > 0
            ? eventRatings.reduce((a, b) => a + b, 0) / eventRatings.length
            : 0;
        return {
          id: event.id.toString(),
          title: event.title,
          rating: avgEventRating,
          feedbackCount: eventRatings.length,
        };
      })
      .filter((e) => e.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);

    // Évolution mensuelle de la participation
    const monthlyData: Record<string, { events: number; participants: number }> = {};
    events.forEach((event) => {
      if (event.createdAt) {
        const monthKey = new Date(event.createdAt).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "short",
        });
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { events: 0, participants: 0 };
        }
        monthlyData[monthKey].events++;
        monthlyData[monthKey].participants += event.users.length;
      }
    });

    // Répartition par créneaux horaires
    const timeSlotCounts = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      weekend: 0,
    };
    events.forEach((event) => {
      if (event.startTime) {
        const hour = new Date(event.startTime).getHours();
        const day = new Date(event.startTime).getDay();
        const isWeekend = day === 0 || day === 6;

        if (isWeekend) {
          timeSlotCounts.weekend++;
        } else if (hour >= 6 && hour < 12) {
          timeSlotCounts.morning++;
        } else if (hour >= 12 && hour < 18) {
          timeSlotCounts.afternoon++;
        } else {
          timeSlotCounts.evening++;
        }
      }
    });

    // Mots-clés les plus fréquents dans les commentaires
    const allMessages = events
      .flatMap((e) => e.feedbacks)
      .filter((f) => f.message)
      .map((f) => f.message!.toLowerCase());
    
    const wordCounts: Record<string, number> = {};
    const stopWords = new Set([
      "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "a",
      "pour", "avec", "sur", "dans", "par", "est", "sont", "était", "été",
      "très", "bien", "bon", "bonne", "super", "génial", "top", "cool",
    ]);
    
    allMessages.forEach((message) => {
      const words = message
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w));
      words.forEach((word) => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    
    const topKeywords = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    const statsData = safeJson({
      hasEvents: true,
      overview: {
        totalEvents,
        avgParticipationRate: Math.round(avgParticipationRate * 10) / 10,
        avgRating: Math.round(avgRating * 10) / 10,
        totalParticipants,
        topActivities,
        topTags,
      },
      participation: {
        responseRate: Math.round(responseRate * 10) / 10,
        totalInvitations,
        totalResponses,
        timeSlotCounts,
      },
      satisfaction: {
        avgRating: Math.round(avgRating * 10) / 10,
        ratingDistribution,
        totalFeedbacks,
        topKeywords,
        topRatedEvents: eventsWithRatings,
      },
      trends: {
        monthlyData: Object.entries(monthlyData)
          .sort(([a], [b]) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA.getTime() - dateB.getTime();
          })
          .map(([month, data]) => ({ month, ...data })),
        topActivities,
        topTags,
      },
      events: events.map((e) => ({
        id: e.id.toString(),
        title: e.title,
        createdAt: e.createdAt,
        participants: e.users.length,
        feedbacks: e.feedbacks.length,
      })),
    });

    // Générer un ETag basé sur les paramètres de requête et les données
    const etag = generateETag({ userId, period, activityType, city, stats: statsData });

    // Vérifier si le client a déjà la dernière version
    if (isNotModified(request, etag)) {
      return new NextResponse(null, { status: 304 });
    }

    // Créer la réponse avec les headers de cache (semi-statique car dépend des filtres)
    const response = NextResponse.json(statsData, { status: 200 });
    return addCacheHeaders(response, CACHE_STRATEGIES.USER_DATA, etag);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

