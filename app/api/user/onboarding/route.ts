import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    // Marquer l'onboarding comme vu
    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: {
        hasSeenOnboarding: true,
      },
      select: {
        id: true,
        hasSeenOnboarding: true,
      },
    });

    return NextResponse.json(
      { message: "Onboarding marqué comme vu", hasSeenOnboarding: updatedUser.hasSeenOnboarding },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'onboarding:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
