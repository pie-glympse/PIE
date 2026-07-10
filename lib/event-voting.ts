import type { PrismaClient } from "@prisma/client";

export type EventVotingStatus = {
  participantCount: number;
  votedCount: number;
  allVoted: boolean;
  missingUserIds: string[];
};

export async function getEventVotingStatus(
  prisma: PrismaClient,
  eventId: bigint,
): Promise<EventVotingStatus> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      users: { select: { id: true } },
      preferences: { select: { userId: true } },
    },
  });

  if (!event) {
    return {
      participantCount: 0,
      votedCount: 0,
      allVoted: false,
      missingUserIds: [],
    };
  }

  const participantIds = event.users.map((user) => user.id.toString());
  const votedUserIds = new Set(
    event.preferences.map((pref) => pref.userId.toString()),
  );
  const missingUserIds = participantIds.filter((id) => !votedUserIds.has(id));

  return {
    participantCount: participantIds.length,
    votedCount: votedUserIds.size,
    allVoted: participantIds.length > 0 && missingUserIds.length === 0,
    missingUserIds,
  };
}
