"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

interface Badge {
  id: bigint;
  name: string;
  description: string;
  icon: string;
  pointsRequired: number;
  order: number;
}

interface UserBadge {
  badge: Badge;
  unlockedAt: Date;
}

export default function RankingPage() {
  const { user, isLoading } = useUser();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());
  const [selectedBadgeId, setSelectedBadgeId] = useState<bigint | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // Charger les données depuis l'API
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);
        const response = await fetch(`/api/badges?userId=${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setBadges(data.badges);
          setUnlockedBadges(new Set(data.unlockedBadges.map((ub: UserBadge) => ub.badge.id.toString())));
          setSelectedBadgeId(data.selectedBadgeId);
          setCurrentPoints(data.points);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des badges:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSelectBadge = async (badgeId: bigint) => {
    if (!user || !unlockedBadges.has(badgeId.toString())) return;

    try {
      const response = await fetch("/api/badges/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, badgeId: badgeId.toString() }),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedBadgeId(badgeId);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du badge:", error);
    }
  };

  // Calculer le badge actuel et le prochain palier
  const maxPoints = 1000; // Point maximum pour la jauge
  const currentBadge = [...badges].reverse().find((badge) => currentPoints >= badge.pointsRequired);
  const nextBadge = badges.find((badge) => currentPoints < badge.pointsRequired);
  // Progression globale sur 1000 points
  const progressPercentage = Math.min((currentPoints / maxPoints) * 100, 100);

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Vous devez être connecté pour voir cette page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Classement & Badges</h1>
          <p className="text-gray-600">Gagnez des points et débloquez des badges exclusifs</p>
        </div>

        {/* Barre de progression verticale */}
        <div className="bg-white rounded-lg p-8 mb-8">
          <div className="flex items-center gap-12 max-w-5xl mx-auto">
            {/* Jauge verticale à gauche */}
            <div className="flex flex-col items-center gap-6">

              {/* Jauge de progression verticale */}
              <div className="relative w-15 h-[600px] bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 w-full bg-[var(--color-secondary)] transition-all duration-500"
                  style={{ height: `${progressPercentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white drop-shadow-lg -rotate-90 whitespace-nowrap">
                    {currentPoints} / {maxPoints}
                  </span>
                </div>
              </div>

              {nextBadge && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Prochain palier</p>
                  <p className="text-xl font-semibold text-gray-700">{nextBadge.name}</p>
                  <p className="text-base text-gray-600">{nextBadge.pointsRequired} pts</p>
                </div>
              )}
            </div>

            {/* Tous les badges à droite */}
            <div className="flex-1 flex flex-col justify-between gap-20">
              {badges.map((badge) => {
                const isUnlocked = currentPoints >= badge.pointsRequired;
                return (
                  <div key={badge.id.toString()} className="flex items-center gap-6">
                    <div className={`w-24 h-24 flex-shrink-0 transition-all ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                      {badge.icon.startsWith('/') ? (
                        <img 
                          src={badge.icon} 
                          alt={badge.name} 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <div className="text-6xl">{badge.icon}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xl font-bold ${isUnlocked ? 'text-black' : 'text-gray-400'}`}>
                        {badge.name}
                      </p>
                      <p className="text-gray-500">{badge.description}</p>
                      <p className={`text-base ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                        {badge.pointsRequired} points requis
                      </p>
                      {isUnlocked && (
                        <span className="inline-block mt-1 text-xs bg-green-500 text-white px-2 py-1 rounded">
                          ✓ Débloqué
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
