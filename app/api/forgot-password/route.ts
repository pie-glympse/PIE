import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { render } from "@react-email/render";
import { PasswordResetEmailTemplate } from "@/components/password-reset-email-template";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/brevo";

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

    // Générer un token de récupération cryptographiquement sécurisé
    const resetToken = randomBytes(32).toString("hex");

    // Créer le lien de récupération
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    try {
      const isDevelopment = process.env.NODE_ENV === "development";
      const recipientEmail = isDevelopment
        ? process.env.BREVO_TEST_EMAIL || "glyms.app@gmail.com"
        : email;

      const subject = isDevelopment
        ? `[TEST] Réinitialisation mot de passe - Demandé pour: ${email}`
        : "Réinitialisation de votre mot de passe - Glyms";

      const html = await render(
        PasswordResetEmailTemplate({ resetLink, userEmail: email })
      );

      await sendEmail({
        to: [{ email: recipientEmail, name: `${user.firstName} ${user.lastName}` }],
        subject,
        html,
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

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
  }
}
