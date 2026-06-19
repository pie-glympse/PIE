// app/api/login/route.ts (Next.js API route)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendEmailTemplate } from "@/lib/brevo";

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

    // Envoyer le mail de bienvenue à la première connexion
    if (!user.welcomeEmailSent) {
      const recipientEmail = process.env.NODE_ENV === "development"
        ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com"
        : user.email;

      sendEmailTemplate({
        to: [{ email: recipientEmail, name: `${user.firstName} ${user.lastName}` }],
        templateId: Number(process.env.BREVO_TEMPLATE_ID_WELCOME_COLLABORATEUR),
        params: { FIRSTNAME: user.firstName },
      }).catch(err => console.error("Erreur envoi mail bienvenue:", err));

      await prisma.user.update({
        where: { id: user.id },
        data: { welcomeEmailSent: true },
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