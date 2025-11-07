import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH - Marquer une notification comme lue
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notification = await prisma.notification.update({
      where: {
        id: BigInt(id),
      },
      data: {
        read: true,
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

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Erreur mise à jour notification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.notification.delete({
      where: {
        id: BigInt(id),
      },
    });

    return NextResponse.json({ message: "Notification supprimée" });
  } catch (error) {
    console.error("Erreur suppression notification:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
