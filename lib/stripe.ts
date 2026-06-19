import Stripe from "stripe";

function getStripeSecretKey(): string {
  const key =
    process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_TEST_API_KEY;

  if (!key) {
    throw new Error(
      "Stripe secret key missing. Set STRIPE_SECRET_KEY or STRIPE_SECRET_TEST_API_KEY.",
    );
  }

  return key;
}

export function getStripePriceId(): string {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error(
      "STRIPE_PRICE_ID is missing. Create a recurring Price in Stripe and add its ID to .env.local.",
    );
  }
  return priceId;
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function resolveRequestBaseUrl(request: Request): string {
  const origin = request.headers.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  return getAppBaseUrl();
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }
  return stripeClient;
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
}

export function isPaidRegistrationSession(
  session: Stripe.Checkout.Session,
): boolean {
  return (
    session.mode === "subscription" &&
    session.status === "complete" &&
    (session.payment_status === "paid" ||
      session.payment_status === "no_payment_required")
  );
}
