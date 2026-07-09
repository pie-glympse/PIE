import { NextResponse } from "next/server";
import {
    getStripe,
    getStripePriceId,
    resolveRequestBaseUrl,
} from "@/lib/stripe";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
    attachStripeSession,
    PENDING_REGISTRATION_COOKIE,
} from "@/lib/pending-registration.server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cookieStore = await cookies();
    const pendingId = (
      (typeof body.pendingId === "string" && body.pendingId) ||
      cookieStore.get(PENDING_REGISTRATION_COOKIE)?.value ||
      ""
    ).trim();

    if (!pendingId) {
      return NextResponse.json(
        {
          error:
            "Inscription d'équipe manquante. Veuillez d'abord inscrire votre équipe.",
        },
        { status: 400 },
      );
    }

    const pending = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId },
    });

    if (!pending || pending.status !== "PENDING") {
      return NextResponse.json(
        { error: "Inscription introuvable ou déjà finalisée" },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const baseUrl = resolveRequestBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: getStripePriceId(),
          quantity: 1,
        },
      ],
      metadata: { pendingId },
      success_url: `${baseUrl}/register/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Impossible de créer la session de paiement" },
        { status: 500 },
      );
    }

    await attachStripeSession(pendingId, session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur création Checkout Session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement Stripe" },
      { status: 500 },
    );
  }
}
