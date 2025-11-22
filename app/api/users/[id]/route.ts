import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;

    // Récupérer l'utilisateur avec tous les champs disponibles
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Construire la réponse avec les champs nécessaires
    const userData = {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      companyId: user.companyId?.toString() || null,
      hasSeenOnboarding: user.hasSeenOnboarding ?? false,
    };

    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération utilisateur:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { firstName, lastName, email, password, photoUrl, bannerUrl } = body;

    const updateData: {
      firstName: string;
      lastName: string;
      email: string;
      password?: string;
      photoUrl?: string;
      bannerUrl?: string;
    } = {
      firstName,
      lastName,
      email,
    };

    // Hash password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update photoUrl if provided
    if (photoUrl !== undefined) {
      updateData.photoUrl = photoUrl;
    }

    // Update bannerUrl if provided
    if (bannerUrl !== undefined) {
      updateData.bannerUrl = bannerUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        photoUrl: true,
        bannerUrl: true,
      },
    });

    return NextResponse.json(safeJson(updatedUser), { status: 200 });
  } catch (error) {
    console.error("Erreur mise à jour utilisateur:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
