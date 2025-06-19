import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { title, description, date, maxPersons, costPerPerson, state } = await request.json();

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : null, // converti si date fournie
        maxPersons: maxPersons ? BigInt(maxPersons) : null,
        costPerPerson: costPerPerson ? BigInt(costPerPerson) : null,
        state,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

return NextResponse.json(
  JSON.parse(
    JSON.stringify(newEvent, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  ),
  { status: 201 }
);  } catch (error) {
    console.error("Erreur création event:", error);
    return NextResponse.json({ error: "Erreur création event" }, { status: 500 });
  }
}
