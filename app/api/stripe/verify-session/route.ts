import { NextRequest, NextResponse } from "next/server";
import {
    createRegistrationAccessToken,
    registrationAccessCookieOptions,
    verifyRegistrationAccessToken,
    REGISTRATION_ACCESS_COOKIE,
} from "@/lib/registration-access";
import {
    isPaidRegistrationSession,
    retrieveCheckoutSession,
} from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(REGISTRATION_ACCESS_COOKIE)?.value;
  const hasAccess = await verifyRegistrationAccessToken(token);

  return NextResponse.json({ hasAccess });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    const session = await retrieveCheckoutSession(sessionId);

    if (!isPaidRegistrationSession(session)) {
      return NextResponse.json(
        { error: "Le paiement n'est pas encore confirmé" },
        { status: 402 },
      );
    }

    const accessToken = await createRegistrationAccessToken(sessionId);
    const response = NextResponse.json({ hasAccess: true });
    const cookie = registrationAccessCookieOptions(accessToken);
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error("Erreur vérification session Stripe:", error);
    return NextResponse.json(
      { error: "Session de paiement invalide" },
      { status: 400 },
    );
  }
}
