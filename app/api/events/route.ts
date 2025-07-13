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
      activityType,
      maxPersons,
      costPerPerson,
      state,
      tags,
      userId,
      city,          // ✅ Ajouté ici
      maxDistance,   // ✅ Ajouté ici
    } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "title manquant" }, { status: 400 });
    }

    const parsedStartDate = startDate ? new Date(startDate + "T00:00:00Z") : null;
    const parsedEndDate = endDate ? new Date(endDate + "T00:00:00Z") : null;

    const parsedStartTime = startTime
      ? new Date(`1970-01-01T${startTime}Z`) // Date fictive juste pour stocker l'heure
      : null;
    const parsedEndTime = endTime
      ? new Date(`1970-01-01T${endTime}Z`)
      : null;


      const userExists = await prisma.user.findUnique({
  where: { id: BigInt(userId) },
});

if (!userExists) {
  return NextResponse.json(
    { error: `User ${userId} introuvable` },
    { status: 404 }
  );
}

    const newEvent = await prisma.event.create({
      data: {
        title,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        maxPersons: maxPersons ? BigInt(maxPersons) : null,
        costPerPerson: costPerPerson ? BigInt(costPerPerson) : null,
        state: state || "PENDING",
        activityType: activityType || null,
        city: city || null,                     
        maxDistance: maxDistance                 
          ? parseFloat(maxDistance)
          : null,
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
