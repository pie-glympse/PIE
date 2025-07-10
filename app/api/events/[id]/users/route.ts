import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const {
      title,
      startDate,
      endDate,
      startTime,
      endTime,
      maxPersons,
      costPerPerson,
      state,
      activityType,
      userId
    } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "title manquant" }, { status: 400 });
    }

    const safeActivityType =
      activityType && activityType.trim() !== "" ? activityType : "DEFAULT";

    const newEvent = await prisma.event.create({
      data: {
        title,
        startDate,
        endDate,
        startTime,
        endTime,
        maxPersons: maxPersons ? BigInt(maxPersons) : null,
        costPerPerson: costPerPerson ? BigInt(costPerPerson) : null,
        state: state || "PENDING",
        activityType: safeActivityType,
        createdAt: new Date(),
        updatedAt: new Date(),
        users: {
          connect: { id: BigInt(userId) },
        },
      },
      include: {
        tags: true,
      },
    });

    const safeEvent = JSON.parse(
      JSON.stringify(newEvent, (_, v) => (typeof v === "bigint" ? v.toString() : v))
    );

    return NextResponse.json(safeEvent, { status: 201 });
  } catch (error) {
    console.error("Erreur création event:", error);
    return NextResponse.json({ error: "Erreur création event" }, { status: 500 });
  }
}
