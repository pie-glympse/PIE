import { NextRequest, NextResponse } from "next/server";
import { retrieveCheckoutSession } from "@/lib/stripe";
import { finalizeRegistrationFromSession } from "@/lib/pending-registration.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    const session = await retrieveCheckoutSession(sessionId);
    const outcome = await finalizeRegistrationFromSession(session);

    switch (outcome.status) {
      case "unpaid":
        return NextResponse.json(
          { error: "Le paiement n'est pas encore confirmé" },
          { status: 402 },
        );
      case "not_found":
        return NextResponse.json(
          { error: "Inscription introuvable pour cette session" },
          { status: 404 },
        );
      case "already":
        return NextResponse.json({ finalized: true, alreadyDone: true });
      case "created":
        return NextResponse.json({
          finalized: true,
          usersCreated: outcome.usersCreated,
          errors: outcome.errors,
        });
    }
  } catch (error) {
    console.error("Erreur vérification session Stripe:", error);
    return NextResponse.json(
      { error: "Session de paiement invalide" },
      { status: 400 },
    );
  }
}
