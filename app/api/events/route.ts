import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
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
        ...(tags && Array.isArray(tags)
          ? {
              tags: {
                connect: tags.map((id: number) => ({ id: BigInt(id) })),
              },
            }
          : {}),
      },
      include: {
        tags: true, // inclure les tags liés dans la réponse
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
