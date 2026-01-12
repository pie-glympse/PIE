import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)));
}

// POST - Accepter ou refuser une invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventIdParam } = await params;
    const body = await request.json();
    const { userId, action } = body; // action: 'accept' ou 'decline'

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId et action sont requis" },
        { status: 400 }
      );
    }

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json(
        { error: "action doit être 'accept' ou 'decline'" },
        { status: 400 }
      );
    }

    const eventId = BigInt(eventIdParam);
    const userIdBigInt = BigInt(userId);

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà participant
    const isAlreadyParticipant = event.users.some(
      (user) => user.id === userIdBigInt
    );

    if (action === "accept") {
      if (isAlreadyParticipant) {
        return NextResponse.json(
          { error: "Vous participez déjà à cet événement" },
          { status: 400 }
        );
      }

      // Ajouter l'utilisateur à l'événement
      await prisma.event.update({
        where: { id: eventId },
        data: {
          users: {
            connect: { id: userIdBigInt },
          },
        },
      });

      // Créer une notification pour le créateur
      if (event.createdById) {
        const user = await prisma.user.findUnique({
          where: { id: userIdBigInt },
          select: {
            firstName: true,
            lastName: true,
          },
        });

        if (user) {
          await prisma.notification.create({
            data: {
              userId: event.createdById,
              message: `@${user.firstName} ${user.lastName} a accepté votre invitation à "${event.title}"`,
              type: "EVENT_INVITATION_ACCEPTED",
              eventId: event.id,
            },
          });
        }
      }

      return NextResponse.json(
        { message: "Invitation acceptée avec succès" },
        { status: 200 }
      );
    } else {
      // action === 'decline'
      // Ne pas ajouter l'utilisateur à l'événement
      // Optionnellement, créer une notification pour le créateur
      if (event.createdById) {
        const user = await prisma.user.findUnique({
          where: { id: userIdBigInt },
          select: {
            firstName: true,
            lastName: true,
          },
        });

        if (user) {
          await prisma.notification.create({
            data: {
              userId: event.createdById,
              message: `@${user.firstName} ${user.lastName} a décliné votre invitation à "${event.title}"`,
              type: "EVENT_INVITATION_DECLINED",
              eventId: event.id,
            },
          });
        }
      }

      return NextResponse.json(
        { message: "Invitation déclinée" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la gestion de l'invitation:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

