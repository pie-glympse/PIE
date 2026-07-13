import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/server-auth";

const toJson = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

const dayKey = (d: Date) => d.toISOString().split("T")[0];

// ─── POST : le créateur retient les dates finales (matchmaking des dates) ───────
// Plusieurs jours possibles (non consécutifs). On fige confirmedDates et on
// aligne startDate/endDate (min/max) pour la compatibilité de l'affichage.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const eventId = BigInt(id);
    const { userId, dates } = await request.json();

    const auth = await requireAuthUser(request, userId);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    const userIdBigInt = auth.userId;

    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { message: "Sélectionnez au moins une date" },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        state: true,
        startDate: true,
        endDate: true,
        proposedDates: true,
        createdById: true,
        users: { select: { id: true } },
      },
    });
    if (!event) {
      return NextResponse.json({ message: "Événement non trouvé" }, { status: 404 });
    }
    if (event.createdById !== userIdBigInt) {
      return NextResponse.json(
        { message: "Seul le créateur peut choisir les dates finales" },
        { status: 403 },
      );
    }

    // Normalisation + validation des jours retenus
    const keys = new Set<string>();
    for (const raw of dates) {
      const parsed = new Date(String(raw));
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ message: "Date invalide" }, { status: 400 });
      }
      keys.add(dayKey(parsed));
    }
    const confirmed = Array.from(keys).sort();

    for (const key of confirmed) {
      if (event.proposedDates && event.proposedDates.length > 0) {
        if (!event.proposedDates.includes(key)) {
          return NextResponse.json(
            { message: "Une des dates retenues n'était pas proposée" },
            { status: 400 },
          );
        }
      } else if (
        (event.startDate && key < dayKey(event.startDate)) ||
        (event.endDate && key > dayKey(event.endDate))
      ) {
        return NextResponse.json(
          { message: "Une des dates retenues est hors de la plage proposée" },
          { status: 400 },
        );
      }
    }

    const startDate = new Date(`${confirmed[0]}T00:00:00.000Z`);
    const endDate = new Date(`${confirmed[confirmed.length - 1]}T00:00:00.000Z`);

    await prisma.event.update({
      where: { id: eventId },
      data: { confirmedDates: confirmed, startDate, endDate },
    });

    // Notifier les participants (sauf le créateur) des dates retenues
    const formatted = confirmed
      .map((k) =>
        new Date(`${k}T00:00:00.000Z`).toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
      )
      .join(", ");
    const recipients = event.users.filter((u) => u.id !== userIdBigInt);
    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((u) => ({
          userId: u.id,
          message: `Dates retenues pour "${event.title}" : ${formatted}`,
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
      toJson({ message: "Dates retenues", event: updatedEvent, confirmedDates: confirmed }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur choix des dates:", error);
    return NextResponse.json({ message: "Erreur serveur interne" }, { status: 500 });
  }
}
