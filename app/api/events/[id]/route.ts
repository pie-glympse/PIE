import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = BigInt(resolvedParams.id);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyId: true,
          },
        },
        // Prisma relation field for the event creator is named `User_Event_createdByIdToUser` in schema
        User_Event_createdByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    // Map long Prisma relation field to `createdBy` for API consumers
    const eventObj: any = { ...event };
    if (eventObj.User_Event_createdByIdToUser) {
      eventObj.createdBy = eventObj.User_Event_createdByIdToUser;
      delete eventObj.User_Event_createdByIdToUser;
    } else {
      eventObj.createdBy = null;
    }

    return NextResponse.json(
      { event: safeJson(eventObj) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur récupération event:", error);
    return NextResponse.json({ error: "Erreur récupération event" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
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
    // Récupérer le userId depuis le body de la requête
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    // Vérifier que l'événement existe et récupérer le créateur
    const event = await prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      select: {
        createdById: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le créateur
    if (event.createdById?.toString() !== userId) {
      return NextResponse.json(
        { error: "Seul le créateur de l'événement peut le supprimer" },
        { status: 403 }
      );
    }

    // Supprimer l'événement
    await prisma.event.delete({
      where: { id: BigInt(eventId) },
    });

    return NextResponse.json("Event deleted", { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'événement" },
      { status: 500 }
    );
  }
}
