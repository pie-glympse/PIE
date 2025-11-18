import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET - Récupérer les lieux blacklistés
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const eventId = searchParams.get('eventId');

    if (!companyId) {
      return NextResponse.json({ error: "Company ID requis" }, { status: 400 });
    }

    // Récupérer les blacklists au niveau entreprise ET au niveau événement (si spécifié)
    const where: any = {
      companyId: BigInt(companyId),
    };

    // Si eventId est fourni, récupérer aussi les blacklists spécifiques à cet événement
    if (eventId) {
      where.OR = [
        { eventId: null }, // Blacklist globale (tous les événements)
        { eventId: BigInt(eventId) }, // Blacklist spécifique à cet événement
      ];
    } else {
      // Si pas d'eventId, seulement les blacklists globales
      where.eventId = null;
    }

    const blacklistedPlaces = await prisma.blacklistedPlace.findMany({
      where,
      select: {
        id: true,
        placeId: true,
        eventId: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formater les résultats pour inclure le titre de l'événement
    const formattedPlaces = blacklistedPlaces.map(place => ({
      id: place.id.toString(),
      placeId: place.placeId,
      eventId: place.eventId?.toString() || null,
      eventTitle: place.event?.title || null,
      createdAt: place.createdAt,
    }));

    return NextResponse.json(formattedPlaces, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération blacklist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Ajouter un lieu à la blacklist
export async function POST(request: Request) {
  try {
    const { placeId, companyId, eventId, createdById } = await request.json();

    if (!placeId || !companyId || !createdById) {
      return NextResponse.json(
        { error: "placeId, companyId et createdById requis" },
        { status: 400 }
      );
    }

    // Vérifier si le lieu n'est pas déjà blacklisté
    // Si eventId est null, vérifier les blacklists globales
    // Si eventId est fourni, vérifier les blacklists globales ET spécifiques
    const whereClause: any = {
      companyId: BigInt(companyId),
      placeId: placeId,
    };

    if (eventId) {
      // Vérifier si blacklisté globalement OU pour cet événement
      whereClause.OR = [
        { eventId: null },
        { eventId: BigInt(eventId) },
      ];
    } else {
      // Vérifier seulement les blacklists globales
      whereClause.eventId = null;
    }

    const existing = await prisma.blacklistedPlace.findFirst({
      where: whereClause,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ce lieu est déjà blacklisté" },
        { status: 409 }
      );
    }

    const blacklistedPlace = await prisma.blacklistedPlace.create({
      data: {
        placeId,
        companyId: BigInt(companyId),
        eventId: eventId ? BigInt(eventId) : null,
        createdById: BigInt(createdById),
      },
    });

    return NextResponse.json(safeJson(blacklistedPlace), { status: 201 });
  } catch (error) {
    console.error("Erreur création blacklist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

