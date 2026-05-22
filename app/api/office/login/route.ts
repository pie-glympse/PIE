import { NextRequest, NextResponse } from "next/server";
import {
  OFFICE_COOKIE_NAME,
  createOfficeToken,
  getOfficeCookieMaxAge,
  validateOfficeCredentials,
} from "@/lib/officeAuth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!validateOfficeCredentials(username, password)) {
      return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 });
    }

    const token = await createOfficeToken();
    const response = NextResponse.json({ message: "Connexion réussie" });
    response.cookies.set(OFFICE_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getOfficeCookieMaxAge(),
    });

    return response;
  } catch (error) {
    console.error("Erreur login office:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
