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
  const eventId = parseInt(params.id); // ou BigInt si tu utilises BigInt dans Prisma

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  return NextResponse.json({ event: safeJson(event) }, { status: 200 });
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
  { params }: { params: { id: string } } // 👈 Toujours une string ici
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
