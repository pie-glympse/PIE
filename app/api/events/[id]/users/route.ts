import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

function getEventIdFromUrl(req: NextRequest): bigint | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);

  // Trouver "events" et prendre le segment suivant
  const eventsIndex = segments.indexOf("events");
  if (eventsIndex === -1 || eventsIndex + 1 >= segments.length) {
    return null;
  }

  const id = segments[eventsIndex + 1];
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}


export async function POST(request: NextRequest) {
  try {
    const eventId = getEventIdFromUrl(request);
    if (!eventId) {
      return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        users: {
          connect: { id: BigInt(userId) },
        },
      },
    });

    return NextResponse.json({ message: "User linked to event successfully" });
  } catch (error) {
    console.error("Error linking user to event:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Récupérer l'ID depuis l'URL
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[segments.length - 2]; // pour /api/events/[id]/users
    const eventId = BigInt(id);

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        users: {
          select: { id: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 }
      );
    }

    const userIds = event.users.map((u) => u.id.toString());

    return NextResponse.json({ userIds });
  } catch (error) {
    console.error("Error fetching event users:", error);
    return NextResponse.json(
      { message: "Erreur serveur lors de la récupération" },
      { status: 500 }
    );
  }
}
