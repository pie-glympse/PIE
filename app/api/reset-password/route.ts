import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma-singleton";

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json();

    // Validation des données
    if (!token?.trim()) {
      return NextResponse.json(
        { error: "Token de récupération manquant" },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Adresse email manquante" },
        { status: 400 }
      );
    }

    if (!password?.trim()) {
      return NextResponse.json(
        { error: "Nouveau mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
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

    // SÉCURITÉ : Vérifier que le token est valide et non expiré
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetTokenRecord) {
      return NextResponse.json(
        { error: "Token de récupération invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le token n'est pas expiré
    if (resetTokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Token de récupération expiré" },
        { status: 400 }
      );
    }

    // Vérifier que le token n'a pas déjà été utilisé
    if (resetTokenRecord.used) {
      return NextResponse.json(
        { error: "Token de récupération déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier que l'email correspond
    if (resetTokenRecord.email !== email.toLowerCase().trim()) {
      return NextResponse.json(
        { error: "Email ne correspond pas au token" },
        { status: 400 }
      );
    }

    const user = resetTokenRecord.user;

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Transaction pour mettre à jour le mot de passe ET marquer le token comme utilisé
    await prisma.$transaction([
      // Mettre à jour le mot de passe
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      // Marquer le token comme utilisé
      prisma.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { used: true },
      }),
    ]);

    console.log(`Mot de passe mis à jour avec succès pour ${email}`);

    return NextResponse.json(
      { message: "Mot de passe modifié avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dans reset-password:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
