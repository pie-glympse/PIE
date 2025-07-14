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
      city,
      maxDistance,
      tags,
      userId,
    } = await request.json();

    console.log("Données reçues:", { userId, title, tags }); // Debug plus complet

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    // Debug: vérifier si l'utilisateur existe
    const userExists = await prisma.user.findUnique({
      where: { id: BigInt(userId) }
    });
    console.log("Utilisateur existe:", !!userExists, "ID:", userId);

    if (!userExists) {
      return NextResponse.json({ 
        error: `L'utilisateur avec l'ID ${userId} n'existe pas en base de données` 
      }, { status: 404 });
    }

    // Debug: si des tags sont fournis, vérifier lesquels existent
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: {
          id: { in: tags.map((id: number) => BigInt(id)) }
        }
      });
      console.log("Tags demandés:", tags);
      console.log("Tags existants:", existingTags.map(t => ({ id: t.id.toString(), name: t.name })));
      
      if (existingTags.length !== tags.length) {
        const missingTags = tags.filter(tagId => 
          !existingTags.some(existingTag => existingTag.id === BigInt(tagId))
        );
        console.log("Tags manquants:", missingTags);
        return NextResponse.json({ 
          error: `Tags manquants avec les IDs: ${missingTags.join(', ')}` 
        }, { status: 400 });
      }
    }

    console.log("Dates reçues:", { startDate, endDate, startTime, endTime }); // Debug

    const newEvent = await prisma.event.create({
      data: {
        title,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        maxPersons: maxPersons ? BigInt(maxPersons) : null,
        costPerPerson: costPerPerson ? BigInt(costPerPerson) : null,
        state,
        activityType,
        city,
        maxDistance: maxDistance ? Number(maxDistance) : null,
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const events = await prisma.event.findMany({
      where: {
        users: {
          some: {
            id: BigInt(userId)
          }
        }
      },
      include: {
        tags: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(
      JSON.parse(
        JSON.stringify(events, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      )
    );
  } catch (error) {
    console.error("Erreur récupération events:", error);
    return NextResponse.json({ error: "Erreur récupération events" }, { status: 500 });
  }
}
