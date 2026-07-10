import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { isPaidRegistrationSession } from "@/lib/stripe";
import { createTeamFromPayload } from "@/lib/register-team.server";
import type { TeamRegistrationPayload } from "@/lib/register-team";

const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const PENDING_REGISTRATION_COOKIE = "glyms_pending_registration";
export const PENDING_REGISTRATION_COOKIE_MAX_AGE = 24 * 60 * 60;

export function pendingRegistrationCookieOptions(pendingId: string) {
  return {
    name: PENDING_REGISTRATION_COOKIE,
    value: pendingId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: PENDING_REGISTRATION_COOKIE_MAX_AGE,
  };
}

export async function createPendingRegistration(
  payload: TeamRegistrationPayload,
): Promise<string> {
  const pending = await prisma.pendingRegistration.create({
    data: {
      payload: payload as unknown as object,
      status: "PENDING",
      expiresAt: new Date(Date.now() + PENDING_MAX_AGE_MS),
    },
  });
  return pending.id;
}

export async function attachStripeSession(
  pendingId: string,
  stripeSessionId: string,
): Promise<void> {
  await prisma.pendingRegistration.update({
    where: { id: pendingId },
    data: { stripeSessionId },
  });
}

export type FinalizeOutcome =
  | { status: "created"; usersCreated: number; errors?: string[] }
  | { status: "already" }
  | { status: "unpaid" }
  | { status: "not_found" };

export async function finalizeRegistrationFromSession(
  session: Stripe.Checkout.Session,
): Promise<FinalizeOutcome> {
  if (!isPaidRegistrationSession(session)) {
    return { status: "unpaid" };
  }

  const pendingId =
    typeof session.metadata?.pendingId === "string"
      ? session.metadata.pendingId
      : undefined;

  if (!pendingId) {
    return { status: "not_found" };
  }

  const claimed = await prisma.pendingRegistration.updateMany({
    where: { id: pendingId, status: "PENDING" },
    data: { status: "COMPLETED", stripeSessionId: session.id },
  });

  if (claimed.count === 0) {
    const existing = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId },
    });
    return existing ? { status: "already" } : { status: "not_found" };
  }

  const pending = await prisma.pendingRegistration.findUnique({
    where: { id: pendingId },
  });

  if (!pending) {
    return { status: "not_found" };
  }

  const payload = pending.payload as unknown as TeamRegistrationPayload;
  const result = await createTeamFromPayload(payload);

  return {
    status: "created",
    usersCreated: result.usersCreated,
    errors: result.errors,
  };
}
