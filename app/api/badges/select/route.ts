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

    // Récupérer l'utilisateur et le badge
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { points: true },
    });

    const badge = await prisma.badge.findUnique({
      where: { id: BigInt(badgeId) },
      select: { pointsRequired: true },
    });

    if (!user || !badge) {
      return NextResponse.json(
        { success: false, error: "Utilisateur ou badge introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur a suffisamment de points
    if (user.points < badge.pointsRequired) {
      return NextResponse.json(
        { success: false, error: "Points insuffisants pour ce badge" },
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
