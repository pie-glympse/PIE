import { NextResponse } from "next/server";
import { createUser } from "../../../lib/user/createUser";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    const user = await createUser({ email, password, name });

    // Conversion de l'id BigInt en string pour le payload JWT et la réponse
    const payload = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    const response = NextResponse.json({ user: payload });

    // Ajout du cookie sécurisé
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    return response;
  } catch (error: any) {
    console.error("Erreur d'inscription :", error);
    return NextResponse.json(
      { error: error.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}
