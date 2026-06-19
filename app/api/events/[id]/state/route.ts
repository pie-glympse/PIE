import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRepresentativeGoogleTagId } from "@/lib/google-tags/sub-group-assignment";
import { getEventVotingStatus } from "@/lib/event-voting";
import { sendEmailTemplate } from "@/lib/brevo";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}

const eventInclude = {
  confirmedGoogleTag: true,
  confirmedGoogleTagSubGroup: true,
  selectedGoogleTagGroups: {
    include: {
      subGroups: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" as const }, { name: "asc" as const }],
      },
    },
  },
  selectedGoogleTags: true,
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const eventId = BigInt(resolvedParams.id);
    const { state: newStateRaw } = await request.json();
    const newState = String(newStateRaw || "").toLowerCase();

    const validStates = ["pending", "confirmed", "planned"];
    if (!newState || !validStates.includes(newState)) {
      return NextResponse.json(
        {
          message:
            "État invalide. États autorisés: pending, confirmed, planned",
        },
        { status: 400 },
      );
    }

    const currentEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        isSpecificPlace: true,
        selectedGoogleTagGroups: {
          select: {
            subGroups: {
              select: { id: true },
              where: { isActive: true },
              take: 1,
            },
          },
        },
        selectedGoogleTags: { select: { id: true } },
      },
    });
    if (!currentEvent) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 },
      );
    }

    if (newState === "confirmed") {
      const votingStatus = await getEventVotingStatus(prisma, eventId);
      if (!votingStatus.allVoted) {
        return NextResponse.json(
          {
            message: `Tous les participants doivent voter avant de confirmer (${votingStatus.votedCount}/${votingStatus.participantCount} ont répondu).`,
            votingStatus,
          },
          { status: 400 },
        );
      }

      const votes = await prisma.eventThemeVote.groupBy({
        by: ["googleTagSubGroupId"],
        where: { eventId },
        _count: { googleTagSubGroupId: true },
        orderBy: {
          _count: { googleTagSubGroupId: "desc" },
        },
      });

      const winnerSubGroupId =
        votes[0]?.googleTagSubGroupId ||
        currentEvent.selectedGoogleTagGroups[0]?.subGroups[0]?.id ||
        null;

      const winnerGoogleTagId = winnerSubGroupId
        ? await getRepresentativeGoogleTagId(prisma, winnerSubGroupId)
        : currentEvent.selectedGoogleTags[0]?.id || null;

      if (!currentEvent.isSpecificPlace && !winnerSubGroupId) {
        return NextResponse.json(
          {
            message:
              "Impossible de confirmer : aucun vote de sous-groupe enregistré.",
          },
          { status: 400 },
        );
      }

      const mostVotedDate = await prisma.eventUserPreference.groupBy({
        by: ["preferredDate"],
        where: { eventId },
        _count: { preferredDate: true },
        orderBy: { _count: { preferredDate: "desc" } },
        take: 1,
      });

      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
          state: newState,
          confirmedGoogleTagSubGroupId: winnerSubGroupId,
          confirmedGoogleTagId: winnerGoogleTagId,
          ...(mostVotedDate.length > 0
            ? { startDate: mostVotedDate[0].preferredDate }
            : {}),
        },
        include: eventInclude,
      });

      const eventWithUsers = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          title: true,
          startDate: true,
          users: { select: { email: true, firstName: true, lastName: true } },
        },
      });
      if (eventWithUsers) {
        const isDev = process.env.NODE_ENV === "development";
        const eventDate = eventWithUsers.startDate
          ? new Date(eventWithUsers.startDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
          : "";
        eventWithUsers.users.forEach((u) => {
          const recipient = isDev ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com" : u.email;
          sendEmailTemplate({
            to: [{ email: recipient, name: `${u.firstName} ${u.lastName}` }],
            templateId: Number(process.env.BREVO_TEMPLATE_ID_EVENT_CONFIRMED),
            params: { FIRSTNAME: u.firstName, EVENT_TITLE: eventWithUsers.title, EVENT_DATE: eventDate },
          }).catch((err) => console.error("Erreur mail event confirmé:", err));
        });
      }

      return NextResponse.json(safeJson(updatedEvent), { status: 200 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { state: newState },
      include: eventInclude,
    });

    return NextResponse.json(safeJson(updatedEvent), { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du state:", error);
    return NextResponse.json(
      { message: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
