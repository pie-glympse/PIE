import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computePublicStatus,
  enrichEventForClient,
  getMaxParticipants,
  getParticipantCount,
} from "@/lib/event-public";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)),
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventIdParam } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    const eventId = BigInt(eventIdParam);
    const userIdBigInt = BigInt(userId);

    const joiningUser = await prisma.user.findUnique({
      where: { id: userIdBigInt },
      select: { id: true, companyId: true, firstName: true, lastName: true },
    });

    if (!joiningUser?.companyId) {
      return NextResponse.json(
        { error: "Vous devez être rattaché à une entreprise" },
        { status: 403 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          users: { select: { id: true } },
          User_Event_createdByIdToUser: { select: { id: true, companyId: true } },
        },
      });

      if (!event) {
        return { error: "Événement non trouvé", status: 404 as const };
      }

      if (!event.isPublic) {
        return { error: "Cet événement n'est pas public", status: 400 as const };
      }

      if (event.publicStatus === "closed") {
        return { error: "Cet événement est fermé", status: 400 as const };
      }

      const creatorCompanyId = event.User_Event_createdByIdToUser?.companyId;
      if (!creatorCompanyId || creatorCompanyId !== joiningUser.companyId) {
        return {
          error: "Cet événement n'est pas accessible dans votre entreprise",
          status: 403 as const,
        };
      }

      if (event.createdById === userIdBigInt) {
        return {
          error: "Vous êtes l'organisateur de cet événement",
          status: 400 as const,
        };
      }

      const alreadyParticipant = event.users.some((u) => u.id === userIdBigInt);
      if (alreadyParticipant) {
        return { error: "Vous participez déjà à cet événement", status: 400 as const };
      }

      const participantCount = getParticipantCount(event.users);
      const maxParticipants = getMaxParticipants(event);

      if (maxParticipants != null && participantCount >= maxParticipants) {
        await tx.event.update({
          where: { id: eventId },
          data: { publicStatus: "full" },
        });
        return { error: "Événement complet", status: 409 as const };
      }

      const newCount = participantCount + 1;
      const newPublicStatus = computePublicStatus(newCount, maxParticipants, event.publicStatus);

      await tx.event.update({
        where: { id: eventId },
        data: {
          users: { connect: { id: userIdBigInt } },
          publicStatus: newPublicStatus,
        },
      });

      // Re-fetch après connect : l'include sur update peut renvoyer une liste users obsolète
      const updated = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              photoUrl: true,
            },
          },
          User_Event_createdByIdToUser: {
            select: { id: true, firstName: true, lastName: true, email: true, companyId: true },
          },
          selectedGoogleTags: true,
          confirmedGoogleTag: true,
          _count: { select: { users: true } },
        },
      });

      if (!updated) {
        return { error: "Événement non trouvé", status: 404 as const };
      }

      if (event.createdById && event.createdById !== userIdBigInt) {
        await tx.notification.create({
          data: {
            userId: event.createdById,
            message: `@${joiningUser.firstName} ${joiningUser.lastName} a rejoint votre événement "${event.title}"`,
            type: "EVENT_PUBLIC_JOIN",
            eventId: event.id,
          },
        });
      }

      return { event: updated, status: 200 as const };
    });

    if ("error" in result && result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (!("event" in result) || !result.event) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
    return NextResponse.json(
      safeJson(enrichEventForClient(result.event, userId)),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur join événement public:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
