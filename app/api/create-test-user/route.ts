import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Créer un utilisateur de test
    const hashedPassword = await bcrypt.hash("123456", 10);
    
    const testUser = await prisma.user.create({
      data: {
        email: "test@test.com",
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
        role: "ADMIN",
      },
    });

    return NextResponse.json({ 
      message: "Utilisateur de test créé avec succès",
      user: {
        id: testUser.id.toString(),
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role
      }
    });
  } catch (error) {
    console.error("Erreur création utilisateur test:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur test" },
      { status: 500 }
    );
  }
}
