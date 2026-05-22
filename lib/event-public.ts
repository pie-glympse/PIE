import type { Event, User } from "@prisma/client";

export type PublicCapacityStatus = "open" | "full" | "closed";

export function getMaxParticipants(event: { maxPersons?: bigint | null }): number | null {
  if (event.maxPersons == null) return null;
  const max = Number(event.maxPersons);
  return max > 0 ? max : null;
}

export function getParticipantCount(users: { id: bigint }[]): number {
  return users.length;
}

export function computePublicStatus(
  participantCount: number,
  maxParticipants: number | null,
  currentStatus?: string | null,
): PublicCapacityStatus {
  if (currentStatus === "closed") return "closed";
  if (maxParticipants != null && participantCount >= maxParticipants) return "full";
  return "open";
}

export function canJoinPublicEvent(params: {
  isPublic: boolean;
  publicStatus: string;
  participantCount: number;
  maxParticipants: number | null;
  isParticipant: boolean;
}): boolean {
  if (!params.isPublic) return false;
  if (params.isParticipant) return false;
  if (params.publicStatus === "closed") return false;
  if (params.maxParticipants != null && params.participantCount >= params.maxParticipants) {
    return false;
  }
  return true;
}

export type EventWithUsers = Event & {
  users: Pick<User, "id">[];
};

export function enrichEventForClient<
  T extends Event & {
    users: { id: bigint | string; firstName?: string; lastName?: string; email?: string; photoUrl?: string }[];
    _count?: { users: number };
    User_Event_createdByIdToUser?: { id: bigint; firstName: string; lastName: string; email: string; companyId?: bigint | null } | null;
  },
>(event: T, currentUserId?: string) {
  const participantCount = event._count?.users ?? event.users.length;
  const maxParticipants = getMaxParticipants(event);
  const isCreator = Boolean(
    currentUserId &&
      event.createdById != null &&
      String(event.createdById) === String(currentUserId),
  );
  const isParticipant =
    isCreator ||
    (currentUserId
      ? event.users.some((u) => String(u.id) === String(currentUserId))
      : false);

  return {
    ...event,
    participantCount,
    maxParticipants,
    isCreator,
    isParticipant,
    canJoin: canJoinPublicEvent({
      isPublic: event.isPublic,
      publicStatus: event.publicStatus,
      participantCount,
      maxParticipants,
      isParticipant,
    }),
    isFull:
      event.isPublic &&
      maxParticipants != null &&
      participantCount >= maxParticipants,
    createdBy: event.User_Event_createdByIdToUser
      ? {
          id: String(event.User_Event_createdByIdToUser.id),
          firstName: event.User_Event_createdByIdToUser.firstName,
          lastName: event.User_Event_createdByIdToUser.lastName,
          email: event.User_Event_createdByIdToUser.email,
        }
      : undefined,
  };
}
