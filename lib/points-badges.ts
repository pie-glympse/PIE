import { prisma } from "@/lib/prisma";

/**
 * Actions qui rapportent des points
 */
export const POINT_ACTIONS = {
  EVENT_PARTICIPATION: 50,
  EVENT_CREATED: 30,
  FEEDBACK_GIVEN: 20,
  PROFILE_COMPLETED: 10,
  FIRST_LOGIN: 5,
} as const;

/**
 * Ajouter des points à un utilisateur
 */
export async function addPoints(
  userId: bigint,
  points: number,
  action: string,
  description?: string,
  eventId?: bigint
) {
  try {
    // Créer l'entrée d'historique
    await prisma.pointsHistory.create({
      data: {
        userId,
        points,
        action,
        description,
        eventId,
      },
    });

    // Mettre à jour le total des points de l'utilisateur
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: points,
        },
      },
      include: {
        UserBadge: {
          include: {
            Badge: true,
          },
        },
      },
    });

    // Vérifier si de nouveaux badges doivent être débloqués
    await checkAndUnlockBadges(userId, user.points);

    return user;
  } catch (error) {
    console.error("Erreur lors de l'ajout de points:", error);
    throw error;
  }
}

/**
 * Vérifier et débloquer les badges en fonction des points
 */
export async function checkAndUnlockBadges(userId: bigint, currentPoints: number) {
  try {
    // Récupérer tous les badges disponibles
    const allBadges = await prisma.badge.findMany({
      where: {
        pointsRequired: {
          lte: currentPoints,
        },
      },
    });

    // Récupérer les badges déjà débloqués
    const unlockedBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });

    const unlockedBadgeIds = unlockedBadges.map((ub) => ub.badgeId);

    // Débloquer les nouveaux badges
    const newBadges = allBadges.filter((badge) => !unlockedBadgeIds.includes(badge.id));

    if (newBadges.length > 0) {
      await prisma.userBadge.createMany({
        data: newBadges.map((badge) => ({
          userId,
          badgeId: badge.id,
        })),
      });

      // Créer des notifications pour les nouveaux badges
      await prisma.notification.createMany({
        data: newBadges.map((badge) => ({
          userId,
          message: `🎉 Nouveau badge débloqué : ${badge.name} !`,
          type: "badge_unlocked",
          read: false,
        })),
      });
    }

    return newBadges;
  } catch (error) {
    console.error("Erreur lors de la vérification des badges:", error);
    throw error;
  }
}

/**
 * Récupérer les badges d'un utilisateur
 */
export async function getUserBadges(userId: bigint) {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        Badge: true,
      },
      orderBy: {
        Badge: {
          order: "asc",
        },
      },
    });

    return userBadges;
  } catch (error) {
    console.error("Erreur lors de la récupération des badges:", error);
    throw error;
  }
}

/**
 * Sélectionner un badge pour le profil
 */
export async function selectBadge(userId: bigint, badgeId: bigint) {
  try {
    // Vérifier que l'utilisateur a bien débloqué ce badge
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });

    if (!userBadge) {
      throw new Error("Badge non débloqué");
    }

    // Mettre à jour le badge sélectionné
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        selectedBadgeId: badgeId,
      },
      include: {
        Badge: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Erreur lors de la sélection du badge:", error);
    throw error;
  }
}

/**
 * Récupérer l'historique des points d'un utilisateur
 */
export async function getPointsHistory(userId: bigint, limit = 50) {
  try {
    const history = await prisma.pointsHistory.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return history;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    throw error;
  }
}

/**
 * Récupérer tous les badges disponibles
 */
export async function getAllBadges() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: {
        order: "asc",
      },
    });

    return badges;
  } catch (error) {
    console.error("Erreur lors de la récupération des badges:", error);
    throw error;
  }
}
