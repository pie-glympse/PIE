import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { title, description, date, maxPersons, costPerPerson, state, tags, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : null,
        maxPersons: maxPersons ? BigInt(maxPersons) : null,
        costPerPerson: costPerPerson ? BigInt(costPerPerson) : null,
        state,
        createdAt: new Date(),
        updatedAt: new Date(),
        users: {
          connect: { id: BigInt(userId) },
        },
        ...(tags && Array.isArray(tags)
          ? {
              tags: {
                connect: tags.map((id: number) => ({ id: BigInt(id) })),
              },
            }
          : {}),
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(newEvent, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur création event:", error);
    return NextResponse.json({ error: "Erreur création event" }, { status: 500 });
  }
}



export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    // Recherche tous les events liés à ce user via la relation many-to-many
    const events = await prisma.event.findMany({
      where: {
        users: {
          some: { id: BigInt(userId) },  // filtre events liés à ce user
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(events, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      ),
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur récupération events:", error);
    return NextResponse.json({ error: "Erreur récupération events" }, { status: 500 });
  }
}