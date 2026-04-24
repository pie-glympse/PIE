import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const eventId = BigInt(resolvedParams.id);
    const { state: newState } = await request.json();

    const validStates = ["pending", "confirmed", "planned"];
    if (!newState || !validStates.includes(newState.toLowerCase())) {
      return NextResponse.json(
        { message: "État invalide. États autorisés: pending, confirmed, planned" },
        { status: 400 },
      );
    }

    const currentEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, selectedGoogleTags: { select: { id: true } } },
    });
    if (!currentEvent) {
      return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });
    }

    if (newState.toLowerCase() === "confirmed") {
      const votes = await prisma.eventThemeVote.groupBy({
        by: ["googleTagId"],
        where: { eventId },
        _count: { googleTagId: true },
        orderBy: [{ _count: { googleTagId: "desc" } }, { googleTagId: "asc" }],
      });

      const winnerGoogleTagId =
        votes[0]?.googleTagId || currentEvent.selectedGoogleTags[0]?.id || null;

      const mostVotedDate = await prisma.eventUserPreference.groupBy({
        by: ["preferredDate"],
        where: { eventId },
        _count: { preferredDate: true },
        orderBy: { _count: { preferredDate: "desc" } },
        take: 1,
      });

      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
          state: newState,
          confirmedGoogleTagId: winnerGoogleTagId,
          ...(mostVotedDate.length > 0
            ? { startDate: mostVotedDate[0].preferredDate }
            : {}),
        },
        include: {
          confirmedGoogleTag: true,
          selectedGoogleTags: true,
        },
      });

      return NextResponse.json(safeJson(updatedEvent), { status: 200 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { state: newState },
      include: { confirmedGoogleTag: true, selectedGoogleTags: true },
    });

    return NextResponse.json(safeJson(updatedEvent), { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du state:", error);
    return NextResponse.json(
      { message: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
