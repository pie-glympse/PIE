import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/server-auth";

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
      select: {
        id: true,
        createdById: true,
        isSpecificPlace: true,
        categoryId: true,
        selectedGoogleTags: { select: { id: true } },
      },
    });
    if (!currentEvent) {
      return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });
    }

    // Seul le créateur ou un admin peut changer l'état
    const auth = await getAuthUser(request);
    if (!auth) {
      return NextResponse.json(
        { message: "Authentification requise" },
        { status: 401 },
      );
    }
    const isCreator = currentEvent.createdById === auth.id;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(auth.role ?? "");
    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { message: "Seul le créateur ou un administrateur peut changer l'état" },
        { status: 403 },
      );
    }

    // Les events à catégorie se confirment via la clôture + choix du lieu
    if (
      newState.toLowerCase() === "confirmed" &&
      !currentEvent.isSpecificPlace &&
      currentEvent.categoryId != null
    ) {
      return NextResponse.json(
        {
          message:
            "Clôturez les votes puis choisissez un lieu pour confirmer cet événement",
        },
        { status: 400 },
      );
    }

    // Confirmation manuelle : réservée aux lieux précis / events sans catégorie
    // (les events à catégorie passent par la clôture + choix du lieu, bloqués
    // plus haut). On retient la date la plus votée si elle existe.
    if (newState.toLowerCase() === "confirmed") {
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
          ...(mostVotedDate.length > 0
            ? { startDate: mostVotedDate[0].preferredDate }
            : {}),
        },
        include: {
          confirmedGoogleTag: true,
          selectedGoogleTags: true,
          location: true,
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
