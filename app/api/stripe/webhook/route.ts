import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { finalizeRegistrationFromSession } from "@/lib/pending-registration.server";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json(
      { error: "Webhook non configuré" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature Stripe manquante" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook Stripe invalide:", error);
    return NextResponse.json(
      { error: "Signature webhook invalide" },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Checkout complété pour inscription:", {
      sessionId: session.id,
      customer: session.customer,
      subscription: session.subscription,
    });

    try {
      const outcome = await finalizeRegistrationFromSession(session);
      console.log("Finalisation inscription (webhook):", {
        sessionId: session.id,
        outcome: outcome.status,
      });
    } catch (error) {
      console.error(
        "Erreur finalisation inscription depuis le webhook:",
        error,
      );
    }
  }

  return NextResponse.json({ received: true });
}
