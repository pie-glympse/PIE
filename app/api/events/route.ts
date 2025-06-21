import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // adapte le chemin si besoin

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { title, description, date, maxPersons, costPerPerson, state, tags } = await request.json();

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

        // association avec l'utilisateur connecté
        users: {
          connect: { id: BigInt(session.user.id) },
        },

        // ajout des tags s'ils existent
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
        users: true,
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
