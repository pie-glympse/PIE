import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les notifications d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis" },
        { status: 400 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: BigInt(userId),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convertir BigInt en string pour JSON
    const serializedNotifications = notifications.map((notif) => ({
      id: notif.id.toString(),
      userId: notif.userId.toString(),
      message: notif.message,
      read: notif.read,
      type: notif.type,
      eventId: notif.eventId?.toString() || null,
      createdAt: notif.createdAt.toISOString(),
    }));

    return NextResponse.json(serializedNotifications);
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message, type, eventId } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: "userId et message requis" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: BigInt(userId),
        message,
        type: type || null,
        eventId: eventId ? BigInt(eventId) : null,
      },
    });

    // Convertir BigInt en string pour JSON
    const serialized = {
      id: notification.id.toString(),
      userId: notification.userId.toString(),
      message: notification.message,
      read: notification.read,
      type: notification.type,
      eventId: notification.eventId?.toString() || null,
      createdAt: notification.createdAt.toISOString(),
    };

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error("Erreur création notification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
