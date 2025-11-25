// app/api/login/route.ts (Next.js API route)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // mettre dans .env

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    // Ajouter des points pour la première connexion
    if (!user.hasSeenOnboarding) {
      const { addPoints, POINT_ACTIONS } = await import("@/lib/points-badges");
      await addPoints(
        user.id,
        POINT_ACTIONS.FIRST_LOGIN,
        "first_login",
        `Bienvenue sur la plateforme !`
      );
      
      // Marquer l'utilisateur comme ayant vu l'onboarding
      await prisma.user.update({
        where: { id: user.id },
        data: { hasSeenOnboarding: true }
      });
    }

    // Créer un token JWT avec id, email, name, role
    const token = jwt.sign(
      {
        id: user.id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Retourner BOTH user AND token dans le JSON
    const response = NextResponse.json({
      user: { 
        id: user.id.toString(), 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId?.toString() || null
      },
      token: token  // ✅ Ajouter le token dans la réponse JSON
    });

    // Optionnel : aussi stocker dans un cookie pour la sécurité
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}