"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import BackArrow from "@/components/ui/BackArrow";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface StatsData {
  hasEvents: boolean;
  overview?: {
    totalEvents: number;
    avgParticipationRate: number;
    avgRating: number;
    totalParticipants: number;
    topActivities: { name: string; count: number }[];
    topTags: { name: string; count: number }[];
  };
  participation?: {
    responseRate: number;
    totalInvitations: number;
    totalResponses: number;
    timeSlotCounts: {
      morning: number;
      afternoon: number;
      evening: number;
      weekend: number;
    };
  };
  satisfaction?: {
    avgRating: number;
    ratingDistribution: { [key: number]: number };
    totalFeedbacks: number;
    topKeywords: { word: string; count: number }[];
    topRatedEvents: { id: string; title: string; rating: number; feedbackCount: number }[];
  };
  trends?: {
    monthlyData: { month: string; events: number; participants: number }[];
    topActivities: { name: string; count: number }[];
    topTags: { name: string; count: number }[];
  };
}

export default function StatsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [activityType, setActivityType] = useState("all");
  const [city, setCity] = useState("all");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, period, activityType, city]);

  const fetchStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: user.id.toString(),
        period,
      });
      if (activityType !== "all") params.append("activityType", activityType);
      if (city !== "all") params.append("city", city);

      const response = await fetch(`/api/stats?${params.toString()}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-main)]"></div>
      </div>
    );
  }

  if (!user) return null;

  if (!stats || !stats.hasEvents) {
    return (
      <section className="min-h-screen pt-24 p-10">
        <BackArrow onClick={() => router.push("/home")} />
        <div className="mt-8 text-center">
          <h2 className="text-h2 font-urbanist text-[var(--color-text)] mb-4">
            Vous n'avez pas encore créé d'événement
          </h2>
          <p className="text-body-large font-poppins text-[var(--color-grey-three)]">
            Créez votre premier événement pour voir vos statistiques ici.
          </p>
        </div>
      </section>
    );
  }

  // Configuration des graphiques avec les couleurs du site
  const chartColors = {
    primary: "#FCC638",
    secondary: "#FF5B5B",
    tertiary: "#F78AFF",
    validate: "#2B983F",
    grey: "#9B9B9B",
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "Poppins",
            size: 12,
          },
          color: "#191919",
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            family: "Poppins",
            size: 11,
          },
          color: "#9B9B9B",
        },
      },
      x: {
        ticks: {
          font: {
            family: "Poppins",
            size: 11,
          },
          color: "#9B9B9B",
        },
      },
    },
  };

  // Données pour le graphique d'évolution mensuelle
  const monthlyChartData = stats.trends?.monthlyData
    ? {
        labels: stats.trends.monthlyData.map((d) => d.month),
        datasets: [
          {
            label: "Événements",
            data: stats.trends.monthlyData.map((d) => d.events),
            borderColor: chartColors.primary,
            backgroundColor: chartColors.primary + "40",
            tension: 0.4,
          },
          {
            label: "Participants",
            data: stats.trends.monthlyData.map((d) => d.participants),
            borderColor: chartColors.secondary,
            backgroundColor: chartColors.secondary + "40",
            tension: 0.4,
          },
        ],
      }
    : null;

  // Données pour la distribution des notes
  const ratingChartData = stats.satisfaction?.ratingDistribution
    ? {
        labels: ["1 étoile", "2 étoiles", "3 étoiles", "4 étoiles", "5 étoiles"],
        datasets: [
          {
            data: [
              stats.satisfaction.ratingDistribution[1] || 0,
              stats.satisfaction.ratingDistribution[2] || 0,
              stats.satisfaction.ratingDistribution[3] || 0,
              stats.satisfaction.ratingDistribution[4] || 0,
              stats.satisfaction.ratingDistribution[5] || 0,
            ],
            backgroundColor: [
              chartColors.secondary,
              chartColors.secondary + "CC",
              chartColors.grey,
              chartColors.primary + "CC",
              chartColors.primary,
            ],
          },
        ],
      }
    : null;

  // Données pour les créneaux horaires
  const timeSlotData = stats.participation?.timeSlotCounts
    ? {
        labels: ["Matin", "Après-midi", "Soir", "Week-end"],
        datasets: [
          {
            data: [
              stats.participation.timeSlotCounts.morning,
              stats.participation.timeSlotCounts.afternoon,
              stats.participation.timeSlotCounts.evening,
              stats.participation.timeSlotCounts.weekend,
            ],
            backgroundColor: [
              chartColors.primary,
              chartColors.secondary,
              chartColors.tertiary,
              chartColors.validate,
            ],
          },
        ],
      }
    : null;

  return (
    <section className="min-h-screen pt-24 p-4 md:p-10 bg-[var(--color-grey-one)]">
      <div className="max-w-7xl mx-auto">
        <BackArrow onClick={() => router.push("/home")} />
        
        {/* Header */}
        <div className="mb-8 mt-4">
          <h1 className="text-h1 font-urbanist text-[var(--color-text)] mb-2">
            Récapitulatif de vos événements
          </h1>
          <p className="text-body-large font-poppins text-[var(--color-grey-three)]">
            Analysez la participation, la satisfaction et les préférences de vos collaborateurs
          </p>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border-2 border-[var(--color-grey-two)] rounded-lg font-poppins text-body-small bg-white"
          >
            <option value="all">Toutes les périodes</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="px-4 py-2 border-2 border-[var(--color-grey-two)] rounded-lg font-poppins text-body-small bg-white"
          >
            <option value="all">Tous les types</option>
            {stats.overview?.topActivities.map((activity) => (
              <option key={activity.name} value={activity.name}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vue globale - Cartes de stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Événements créés"
            value={stats.overview?.totalEvents || 0}
            subtitle={period === "all" ? "Total" : `Période sélectionnée`}
            color={chartColors.primary}
          />
          <StatCard
            title="Taux de participation"
            value={`${stats.overview?.avgParticipationRate || 0}%`}
            subtitle="Moyenne"
            color={chartColors.validate}
          />
          <StatCard
            title="Note moyenne"
            value={stats.overview?.avgRating ? `${stats.overview.avgRating.toFixed(1)}/5` : "0/5"}
            subtitle={`${stats.satisfaction?.totalFeedbacks || 0} avis`}
            color={chartColors.secondary}
          />
          <StatCard
            title="Participants uniques"
            value={stats.overview?.totalParticipants || 0}
            subtitle="Total"
            color={chartColors.tertiary}
          />
        </div>

        {/* Top activités et tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-4">
              Top 3 activités
            </h3>
            <div className="space-y-3">
              {stats.overview?.topActivities.map((activity, index) => (
                <div key={activity.name} className="flex items-center justify-between">
                  <span className="text-body-large font-poppins text-[var(--color-text)]">
                    {index + 1}. {activity.name}
                  </span>
                  <span className="text-body-small font-poppins text-[var(--color-grey-three)]">
                    {activity.count} événement{activity.count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-4">
              Top 3 catégories
            </h3>
            <div className="space-y-3">
              {stats.overview?.topTags.map((tag, index) => (
                <div key={tag.name} className="flex items-center justify-between">
                  <span className="text-body-large font-poppins text-[var(--color-text)]">
                    {index + 1}. {tag.name}
                  </span>
                  <span className="text-body-small font-poppins text-[var(--color-grey-three)]">
                    {tag.count} événement{tag.count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Évolution mensuelle */}
          {monthlyChartData && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-4">
                Évolution de la participation
              </h3>
              <div className="h-64">
                <Line data={monthlyChartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Distribution des notes */}
          {ratingChartData && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-4">
                Distribution des notes
              </h3>
              <div className="h-64">
                <Bar data={ratingChartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Créneaux horaires */}
          {timeSlotData && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-4">
                Répartition par créneaux
              </h3>
              <div className="h-64">
                <Doughnut data={timeSlotData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Taux de réponse */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-4">
              Participation & Engagement
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-body-large font-poppins text-[var(--color-text)]">
                    Taux de réponse
                  </span>
                  <span className="text-body-large font-poppins font-semibold text-[var(--color-text)]">
                    {stats.participation?.responseRate || 0}%
                  </span>
                </div>
                <div className="w-full bg-[var(--color-grey-two)] rounded-full h-3">
                  <div
                    className="bg-[var(--color-validate)] h-3 rounded-full transition-all"
                    style={{
                      width: `${stats.participation?.responseRate || 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="pt-4 border-t border-[var(--color-grey-two)]">
                <div className="flex justify-between">
                  <span className="text-body-small font-poppins text-[var(--color-grey-three)]">
                    Invitations envoyées
                  </span>
                  <span className="text-body-small font-poppins font-semibold text-[var(--color-text)]">
                    {stats.participation?.totalInvitations || 0}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-body-small font-poppins text-[var(--color-grey-three)]">
                    Réponses reçues
                  </span>
                  <span className="text-body-small font-poppins font-semibold text-[var(--color-text)]">
                    {stats.participation?.totalResponses || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Événements les mieux notés */}
        {stats.satisfaction?.topRatedEvents && stats.satisfaction.topRatedEvents.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-4">
              Événements les mieux notés
            </h3>
            <div className="space-y-3">
              {stats.satisfaction.topRatedEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-[var(--color-grey-one)] rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="text-body-large font-poppins font-semibold text-[var(--color-text)]">
                      {event.title}
                    </h4>
                    <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
                      {event.feedbackCount} avis
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-h3 font-urbanist text-[var(--color-main)]">
                      {event.rating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.round(event.rating)
                              ? "text-[var(--color-main)]"
                              : "text-[var(--color-grey-two)]"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mots-clés */}
        {stats.satisfaction?.topKeywords && stats.satisfaction.topKeywords.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-4">
              Mots-clés les plus fréquents
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats.satisfaction.topKeywords.map((keyword) => (
                <span
                  key={keyword.word}
                  className="px-3 py-1 bg-[var(--color-grey-one)] rounded-full text-body-small font-poppins text-[var(--color-text)]"
                  style={{
                    fontSize: `${12 + keyword.count * 2}px`,
                    opacity: 0.6 + (keyword.count / 10) * 0.4,
                  }}
                >
                  {keyword.word} ({keyword.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Composant de carte de statistique
function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h4 className="text-body-small font-poppins text-[var(--color-grey-three)] mb-2">
        {title}
      </h4>
      <p
        className="text-h1 font-urbanist mb-1"
        style={{ color }}
      >
        {value}
      </p>
      <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
        {subtitle}
      </p>
    </div>
  );
}

