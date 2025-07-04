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

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tags: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
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


  export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
  ) {
    const eventId = Number(params.id);

    if (isNaN(eventId)) {
      return new Response("Invalid note ID", { status: 400 });
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
      return new Response("Note not found or update failed", {
        status: 404,
      });
    }
  }

  export async function DELETE(
  req: Request,
  { params }: { params: { id: string } } 
) {

      console.log("sigma")

  const eventId =  Number(params.id);

  if (isNaN(eventId)) {
    return new Response("Invalid note ID", { status: 400 });
  }

  try {
    await prisma.event.delete({
      where: { id: eventId },
    });

  return NextResponse.json("Event deleted", { status: 200 });
  } catch (error) {
    return new Response("Note not found or could not be deleted", {
      status: 404,
    });
  }
}
