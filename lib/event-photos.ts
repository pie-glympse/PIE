import { prisma } from "@/lib/prisma";

export async function userCanAccessEventPhotos(
  eventId: bigint,
  userId: bigint,
): Promise<boolean> {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      OR: [{ createdById: userId }, { users: { some: { id: userId } } }],
    },
    select: { id: true },
  });

  return Boolean(event);
}

export async function userCanDeleteEventPhoto(params: {
  eventId: bigint;
  userId: bigint;
  photoUserId: bigint;
}): Promise<boolean> {
  const { eventId, userId, photoUserId } = params;

  if (photoUserId === userId) return true;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { createdById: true },
  });

  return event?.createdById === userId;
}
