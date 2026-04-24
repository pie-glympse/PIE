import { prisma } from "@/lib/prisma";

export type AccessResult =
  | { ok: true }
  | { ok: false; status: 404 | 403 };

/**
 * Creator or participant can read event-scoped data.
 */
export async function assertEventAccess(
  eventId: bigint,
  authUserId: string
): Promise<AccessResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      createdById: true,
      users: { select: { id: true } },
    },
  });
  if (!event) return { ok: false, status: 404 };
  const isCreator = event.createdById?.toString() === authUserId;
  const isParticipant = event.users.some((u) => u.id.toString() === authUserId);
  if (!isCreator && !isParticipant) return { ok: false, status: 403 };
  return { ok: true };
}

/**
 * Only the event creator may perform organizer actions.
 */
export async function assertEventCreator(
  eventId: bigint,
  authUserId: string
): Promise<AccessResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { createdById: true },
  });
  if (!event) return { ok: false, status: 404 };
  if (event.createdById?.toString() !== authUserId) {
    return { ok: false, status: 403 };
  }
  return { ok: true };
}
