import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, userId } = body;

    if (!eventId || !userId) {
      return NextResponse.json(
        { message: "eventId et userId sont requis" },
        { status: 400 }
      );
    }

    await prisma.eventUserPreference.create({
      data: {
        eventId: BigInt(eventId),
        userId: BigInt(userId),
        preferredDate: new Date(), // adapte si besoin
        tagId: BigInt(0), // adapte si besoin
      },
    });

    return NextResponse.json({ message: "User added to event." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
