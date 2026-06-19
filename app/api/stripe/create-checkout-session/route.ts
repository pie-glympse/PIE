import { NextResponse } from "next/server";
import {
    getStripe,
    getStripePriceId,
    resolveRequestBaseUrl,
} from "@/lib/stripe";

export async function POST(request: Request) {
  try {
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
      success_url: `${baseUrl}/register?session_id={CHECKOUT_SESSION_ID}`,
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

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur création Checkout Session:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement Stripe" },
      { status: 500 },
    );
  }
}
