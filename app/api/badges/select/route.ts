import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, badgeId } = body;

    if (!userId || !badgeId) {
      return NextResponse.json(
        { success: false, error: "userId et badgeId requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a bien débloqué ce badge
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: {
          userId: BigInt(userId),
          badgeId: BigInt(badgeId),
        },
      },
    });

    if (!userBadge) {
      return NextResponse.json(
        { success: false, error: "Badge non débloqué" },
        { status: 403 }
      );
    }

    // Mettre à jour le badge sélectionné
    await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        selectedBadgeId: BigInt(badgeId),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Badge sélectionné avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la sélection du badge:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
