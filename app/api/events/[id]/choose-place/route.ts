import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/server-auth";

const toJson = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

// ─── POST : le créateur choisit le lieu final parmi les 5 propositions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const eventId = BigInt(id);
    const { userId, proposalId } = await request.json();
    if (!proposalId) {
      return NextResponse.json(
        { message: "proposalId est requis" },
        { status: 400 },
      );
    }
    const auth = await requireAuthUser(request, userId);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const userIdBigInt = auth.userId;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        state: true,
        startDate: true,
        createdById: true,
        users: { select: { id: true } },
      },
    });
    if (!event) {
      return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });
    }
    if (event.createdById !== userIdBigInt) {
      return NextResponse.json(
        { message: "Seul le créateur peut choisir le lieu final" },
        { status: 403 },
      );
    }
    if (event.state?.toLowerCase() === "confirmed") {
      return NextResponse.json(
        { message: "L'événement est déjà confirmé" },
        { status: 400 },
      );
    }

    const proposal = await prisma.eventPlaceProposal.findUnique({
      where: { id: BigInt(proposalId) },
    });
    if (!proposal || proposal.eventId !== eventId) {
      return NextResponse.json(
        { message: "Proposition introuvable pour cet événement" },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.eventPlaceProposal.updateMany({
        where: { eventId },
        data: { chosen: false },
      });
      await tx.eventPlaceProposal.update({
        where: { id: proposal.id },
        data: { chosen: true },
      });

      // Le lieu choisi devient le lieu officiel de l'événement
      await tx.eventLocation.upsert({
        where: { eventId },
        update: {
          placeId: proposal.placeId,
          name: proposal.name,
          address: proposal.address,
          lat: proposal.lat,
          lng: proposal.lng,
        },
        create: {
          id: eventId,
          eventId,
          placeId: proposal.placeId,
          name: proposal.name,
          address: proposal.address,
          lat: proposal.lat,
          lng: proposal.lng,
        },
      });

      await tx.event.update({
        where: { id: eventId },
        data: { state: "confirmed" },
      });
    });

    // Notifier tous les participants (sauf le créateur)
    const eventDate = event.startDate
      ? new Date(event.startDate).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : null;
    const recipients = event.users.filter((u) => u.id !== userIdBigInt);
    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((u) => ({
          userId: u.id,
          message: `Événement confirmé : "${event.title}" aura lieu à ${proposal.name}${eventDate ? ` le ${eventDate}` : ""}`,
          type: "EVENT_CONFIRMED",
          eventId,
        })),
      });
    }

    const updatedEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { location: true },
    });

    return NextResponse.json(
      toJson({
        message: "Lieu confirmé",
        event: updatedEvent,
        chosenProposal: proposal,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur choix du lieu:", error);
    return NextResponse.json({ message: "Erreur serveur interne" }, { status: 500 });
  }
}
