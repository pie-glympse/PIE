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

    // Dans une vraie application, vous devriez :
    // 1. Vérifier que le token existe dans la base de données
    // 2. Vérifier qu'il n'est pas expiré
    // 3. Vérifier qu'il correspond à l'email

    // Pour l'instant, nous simulons cette vérification
    // Note: Dans une application de production, ajouter une table pour les tokens de récupération
    console.log(
      `Tentative de réinitialisation pour ${email} avec token ${token}`
    );

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

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
