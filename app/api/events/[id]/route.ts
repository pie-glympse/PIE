import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function safeJson(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// 🔥 Fonction utilitaire pour récupérer l'id depuis l'URL
function getEventIdFromUrl(req: Request): number | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean); // ["api", "events", "123"]
  const id = segments[segments.length - 1]; // Dernier segment = "123"
  const eventId = Number(id);
  return isNaN(eventId) ? null : eventId;
}

export async function GET(req: Request) {
  const eventId = getEventIdFromUrl(req);

  if (eventId === null) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tags: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    return NextResponse.json(safeJson(event), { status: 200 });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const eventId = getEventIdFromUrl(req);

  if (eventId === null) {
    return new Response("Invalid event ID", { status: 400 });
  }

  const body = await req.json();

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: body.title,
        description: body.description,
      },
    });

    return NextResponse.json({ event: safeJson(updatedEvent) });
  } catch (error) {
    return new Response("Event not found or update failed", { status: 404 });
  }
}

export async function DELETE(req: Request) {
  const eventId = getEventIdFromUrl(req);

  if (eventId === null) {
    return new Response("Invalid event ID", { status: 400 });
  }

  try {
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json("Event deleted", { status: 200 });
  } catch (error) {
    return new Response("Event not found or could not be deleted", {
      status: 404,
    });
  }
}
