import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Récupère l'id de l'événement depuis l'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const eventId = pathParts[pathParts.length - 2];

    const { userId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId manquant" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    // Vérifie que l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });
    if (!userExists) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Vérifie que l'événement existe
    const eventExists = await prisma.event.findUnique({
      where: { id: BigInt(eventId) },
    });
    if (!eventExists) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }

    // Ajoute l'utilisateur à l'événement (relation many-to-many)
    await prisma.event.update({
      where: { id: BigInt(eventId) },
      data: {
        users: {
          connect: { id: BigInt(userId) },
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur ajout user à event:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  let response;
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const eventId = pathParts[pathParts.length - 2]; // /api/events/[id]/users → [id] est l'avant-dernier

    if (!eventId) {
      response = NextResponse.json({ error: "eventId manquant" }, { status: 400 });
    } else {
      // Récupère les utilisateurs liés à l'événement
      const event = await prisma.event.findUnique({
        where: { id: BigInt(eventId) },
        include: { users: true },
      });

      if (!event) {
        response = NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
      } else {
        // Convertit les BigInt en string pour le JSON
        const safeUsers = JSON.parse(
          JSON.stringify(event.users, (_, v) => (typeof v === "bigint" ? v.toString() : v))
        );

        response = NextResponse.json({ users: safeUsers }, { status: 200 });
      }
    }
  } catch (error) {
    console.error("Erreur GET users event:", error);
    response = NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
  return response;
}
