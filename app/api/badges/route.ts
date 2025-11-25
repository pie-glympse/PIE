import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId requis" },
        { status: 400 }
      );
    }

    // Récupérer tous les badges
    const badges = await prisma.badge.findMany({
      orderBy: {
        order: "asc",
      },
    });

    // Récupérer l'utilisateur avec ses données de points et badges
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        points: true,
        selectedBadgeId: true,
        userBadges: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Convertir les BigInt en string pour la sérialisation JSON
    const serializedBadges = badges.map((badge) => ({
      ...badge,
      id: badge.id.toString(),
    }));

    const serializedUnlockedBadges = user.userBadges.map((ub) => ({
      badge: {
        ...ub.badge,
        id: ub.badge.id.toString(),
      },
      unlockedAt: ub.unlockedAt,
    }));

    return NextResponse.json({
      success: true,
      badges: serializedBadges,
      unlockedBadges: serializedUnlockedBadges,
      points: user.points || 0,
      selectedBadgeId: user.selectedBadgeId?.toString() || null,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des badges:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
