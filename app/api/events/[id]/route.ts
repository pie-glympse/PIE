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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = BigInt(resolvedParams.id);
    const body = await request.json();

    // Vérifier d'abord si l'événement existe et récupérer son créateur
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { createdById: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le créateur de l'événement
    if (body.userId && existingEvent.createdById !== BigInt(body.userId)) {
      return NextResponse.json(
        { message: "Vous n'êtes pas autorisé à modifier cet événement" },
        { status: 403 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.startTime !== undefined) updateData.startTime = body.startTime ? new Date(body.startTime) : null;
    if (body.endTime !== undefined) updateData.endTime = body.endTime ? new Date(body.endTime) : null;
    if (body.city !== undefined) updateData.city = body.city;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        tags: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ event: safeJson(updatedEvent) }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la modification de l'événement:", error);
    return NextResponse.json(
      { message: "Erreur lors de la modification de l'événement" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
