import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { randomBytes } from "node:crypto";
import { PasswordResetEmailTemplate } from "@/components/password-reset-email-template";
import { prisma } from "@/lib/prisma-singleton";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Créer une date d'expiration (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // TODO: Stocker le token en base de données une fois la table créée
    // await prisma.passwordResetToken.create({
    //   data: {
    //     token: resetToken,
    //     email: email.toLowerCase().trim(),
    //     userId: user.id,
    //     expiresAt,
    //   }
    // });
    
    console.log(`Token généré pour ${email}: ${resetToken} (expire: ${expiresAt.toISOString()})`);

    // Créer le lien de récupération
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    try {
      // Envoyer l'email de récupération avec Resend
      // En mode développement, utiliser l'adresse de test vérifiée
      const isDevelopment = process.env.NODE_ENV === "development";
      const recipientEmail = isDevelopment
        ? process.env.RESEND_TEST_EMAIL || "glyms.app@gmail.com"
        : email;

      const subject = isDevelopment
        ? `[TEST] Réinitialisation mot de passe - Demandé pour: ${email}`
        : "Réinitialisation de votre mot de passe - Glyms";

      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Glyms <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        react: PasswordResetEmailTemplate({
          resetLink,
          userEmail: email,
        }),
      });

      if (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return NextResponse.json(
          { error: "Erreur lors de l'envoi de l'email" },
          { status: 500 }
        );
      }

      console.log(
        `Email de récupération envoyé avec succès pour ${email}`,
        data
      );
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
