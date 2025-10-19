import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validation de l'email
    if (!email?.trim()) {
      return NextResponse.json(
        { error: "L'adresse email est requise" },
        { status: 400 }
      );
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json(
        {
          message:
            "Si cet email existe dans notre système, un lien de récupération sera envoyé.",
        },
        { status: 200 }
      );
    }

    // Générer un token de récupération (vous pouvez utiliser une librairie comme crypto pour plus de sécurité)
    const resetToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Dans une vraie application, vous devriez :
    // 1. Stocker ce token avec une expiration dans la base de données
    // 2. Envoyer un email avec le lien de récupération

    // Pour l'instant, nous allons simuler l'envoi d'email
    console.log(`Token de récupération pour ${email}: ${resetToken}`);
    console.log(
      `Lien de récupération: ${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
    );

    // Note: Dans une application de production, implémentez l'envoi d'email ici
    // Exemple: await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json(
      { message: "Un email de récupération a été envoyé à votre adresse." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dans forgot-password:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
