"use client";
import { useUser } from "../../context/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackArrow from "@/components/ui/BackArrow";
import Tilt from "react-parallax-tilt";


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
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<Set<string>>(new Set());
  const [selectedBadgeId, setSelectedBadgeId] = useState<bigint | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);

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
    if (!user) return;

    // Vérifier si le badge est débloqué en fonction des points
    const badge = badges.find(b => b.id === badgeId);
    if (!badge || currentPoints < badge.pointsRequired) {
      console.log("Badge non débloqué ou introuvable");
      return;
    }

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

  // Initialiser le badge actif avec le badge actuel de l'utilisateur
  useEffect(() => {
    if (badges.length > 0 && !activeBadge) {
      const current = [...badges].reverse().find((badge) => currentPoints >= badge.pointsRequired);
      setActiveBadge(current || badges[0]);
    }
  }, [badges, currentPoints, activeBadge]);

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
    <div className="min-h-screen bg-white py-8 px-4 pt-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-8">
          {/* Colonne de gauche - 1/3 */}
          <div className="w-1/3 flex flex-col gap-6">
          <div className="flex gap-10 mb-4 justify-start items-center">
            <BackArrow onClick={() => router.back()} className="!mb-0" />
            {/* Palier actuel */}
            <div className="text-center">
              <p className="text-sm text-gray-500 font-poppins mb-1">Palier actuel</p>
              <h2 className="text-2xl font-bold font-urbanist text-[var(--color-text)]">
                {currentBadge ? currentBadge.name : "Aucun badge"}
              </h2>
          </div>
            </div>

            {/* Paragraphe d'information */}
            <div className="rounded-lg p-4 mb-5">
              <p className="text-xs font-poppins text-gray-700 leading-relaxed">
                Les badges sont <strong>uniquements</strong> à but <strong>cosmetique</strong> et pour prouer votre infinie superioritée a vos collègues,
              </p>
              <p className="text-xs font-poppins text-gray-700 leading-relaxed">
                sélectionner le badge qui vous plaît, il apparaîtra à côté de votre nom, vous pouvez aussi <strong>moyennant 
                payement</strong> vous procurer <strong>des badges exclusifs</strong>
              </p>
            </div>

            {/* 4 cases des badges */}
            <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-5 max-w-[280px] mb-6">
              {badges.map((badge) => {
                const isUnlocked = currentPoints >= badge.pointsRequired;
                const isSelected = selectedBadgeId && badge.id === selectedBadgeId;
                return (
                  <button
                    key={badge.id.toString()}
                    onClick={() => setActiveBadge(badge)}
                    className={`bg-[var(--color-grey-two)] rounded-lg w-28 h-28 flex items-center justify-center transition-all overflow-visible relative ${
                      activeBadge?.id === badge.id ? 'ring-2 ring-[var(--color-main)]' : ''
                    }`}
                  >
                    {/* Indicateur de badge sélectionné */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10 shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                    <div className={`w-36 h-36 ${isUnlocked ? '' : ''}`}>
                      {badge.icon.startsWith('/') ? (
                        <img 
                          src={badge.icon}  
                          alt={badge.name} 
                          className="w-full h-full object-contain"
                          style={{
                            filter: isUnlocked 
                              ? 'none' 
                              : 'grayscale(100%) brightness(0.6) contrast(1.2)'
                          }}
                        />
                      ) : (
                        <div className="text-5xl"
                        style={{
                          filter: isUnlocked 
                            ? 'none' 
                            : 'grayscale(100%) brightness(1) contrast(1)'
                        }}>
                          {badge.icon}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            </div>

            {/* Bouton noir */}
            <button 
              onClick={() => activeBadge && handleSelectBadge(activeBadge.id)}
              disabled={!activeBadge || currentPoints < activeBadge.pointsRequired}
              className={`w-full bg-black text-white font-poppins font-medium py-3 rounded-lg transition-colors ${
                activeBadge && currentPoints >= activeBadge.pointsRequired
                  ? 'hover:bg-gray-800 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {activeBadge && currentPoints >= activeBadge.pointsRequired 
                ? 'Confirmer mon choix' 
                : 'Badge non débloqué'}
            </button>
          </div>

          {/* Colonne de droite - 2/3 */}
          <div className="flex-1 rounded-lg p-12 flex flex-col justify-end">
            {activeBadge && (
              <div className="flex flex-col items-center">
                {/* Grande image du badge - taille fixe avec effet 3D */}
                <Tilt
                  tiltMaxAngleX={35}
                  tiltMaxAngleY={35}
                  perspective={1000}
                  scale={1.05}
                  transitionSpeed={3000}
                  className="w-90 h-90 mb-8"
                >
                  <div className="w-full h-full flex items-center justify-center flex-shrink-0 relative">
                    
                    {/* Badge avec effet métallique et bordure */}
                    <div className={`relative w-full h-full flex items-center justify-center p-8 ${
                      currentPoints >= activeBadge.pointsRequired ? 'drop-shadow-2xl' : 'drop-shadow-xl'
                    }`}>
                      {activeBadge.icon.startsWith('/') ? (
                        <img 
                          src={activeBadge.icon} 
                          alt={activeBadge.name} 
                          className="w-full h-full object-contain"
                          style={{
                            filter: currentPoints >= activeBadge.pointsRequired 
                              ? 'drop-shadow(0 10px 5px rgba(12, 12, 12, 0.09))' 
                              : 'grayscale(100%) brightness(0.9) contrast(1) drop-shadow(0 10px 5px rgba(0, 0, 0, 0.4))'
                          }}
                        />
                      ) : (
                        <div className="text-[150px] leading-none"
                        style={{
                          filter: currentPoints >= activeBadge.pointsRequired 
                            ? 'drop-shadow(0 10px 5px rgba(22, 22, 22, 0.09))' 
                            : 'grayscale(100%) brightness(0.9) contrast(1) drop-shadow(0 10px 5px rgba(0, 0, 0, 0.4))'
                        }}>
                          {activeBadge.icon}
                        </div>
                      )}
                    </div>
                  </div>
                </Tilt>

                {/* Nom du badge */}
                <h2 className="text-2xl font-bold font-urbanist text-[var(--color-text)] mb-4">
                  {activeBadge.name}
                </h2>

                {/* Texte explicatif - hauteur fixe */}
                <div className="h-16 mb-8 flex items-center">
                  <p className="text-center font-poppins text-gray-700 max-w-md line-clamp-3">
                    {activeBadge.description}
                  </p>
                </div>

                {/* Barre de progression horizontale - 4 segments */}
                <div className="w-full max-w-3xl">
                  <div className="flex gap-2">
                    {badges.map((badge, index) => {
                      const prevPoints = index === 0 ? 0 : badges[index - 1].pointsRequired;
                      const targetPoints = badge.pointsRequired === 0 ? 100 : badge.pointsRequired;
                      const segmentPoints = targetPoints - prevPoints;
                      const segmentProgress = Math.max(0, Math.min(100, ((currentPoints - prevPoints) / segmentPoints) * 100));
                      const isCompleted = currentPoints >= badge.pointsRequired;
                      const segmentWidth = (segmentPoints / maxPoints) * 100;
                      
                      return (
                        <div 
                          key={badge.id.toString()} 
                          style={{ width: `${segmentWidth}%`, minWidth: '60px' }}
                        >
                          <div className="relative h-4 bg-gray-300 rounded-full overflow-hidden">
                            <div
                              className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                                isCompleted 
                                  ? 'bg-[var(--color-secondary)]' 
                                  : 'bg-[var(--color-secondary)]'
                              }`}
                              style={{ width: `${isCompleted ? 100 : segmentProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-center mt-1 font-poppins text-gray-600">
                            {badge.pointsRequired} pts
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Légende */}
                  <div className="flex justify-between mt-4 text-sm font-poppins text-gray-600">
                    <span>0 pts</span>
                    <span className="font-semibold text-[var(--color-text)]">{currentPoints} pts</span>
                    <span>{maxPoints} pts</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
