import { NextResponse } from "next/server";
import { getStripe, getStripePriceId } from "@/lib/stripe";
import { GLYMS_PLAN_BENEFITS } from "@/lib/stripe-pricing";

export async function GET() {
  try {
    const stripe = getStripe();
    const price = await stripe.prices.retrieve(getStripePriceId(), {
      expand: ["product"],
    });

    const product =
      typeof price.product === "object" && price.product !== null
        ? price.product
        : null;

    const amount =
      price.unit_amount != null
        ? new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: (price.currency || "eur").toUpperCase(),
          }).format(price.unit_amount / 100)
        : null;

    const intervalLabel =
      price.recurring?.interval === "month"
        ? "mois"
        : price.recurring?.interval === "year"
          ? "an"
          : price.recurring?.interval || "période";

    return NextResponse.json({
      name: product && "name" in product ? product.name : "Glyms Pro",
      description:
        product && "description" in product ? product.description : null,
      amount,
      intervalLabel,
      benefits: GLYMS_PLAN_BENEFITS,
    });
  } catch (error) {
    console.error("Erreur récupération pricing Stripe:", error);
    return NextResponse.json(
      {
        error:
          "Impossible de charger l'offre. Vérifiez STRIPE_PRICE_ID dans .env.local.",
        benefits: GLYMS_PLAN_BENEFITS,
      },
      { status: 500 },
    );
  }
}
