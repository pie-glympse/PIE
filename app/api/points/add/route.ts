import { NextRequest, NextResponse } from "next/server";
import { addPoints, POINT_ACTIONS } from "@/lib/points-badges";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, description, eventId } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: "userId et action requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'action existe
    const points = POINT_ACTIONS[action as keyof typeof POINT_ACTIONS];
    if (points === undefined) {
      return NextResponse.json(
        { success: false, error: "Action invalide" },
        { status: 400 }
      );
    }

    // Ajouter les points
    const user = await addPoints(
      BigInt(userId),
      points,
      action,
      description,
      eventId ? BigInt(eventId) : undefined
    );

    return NextResponse.json({
      success: true,
      points: user.points,
      message: `+${points} points gagnés !`,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout de points:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
