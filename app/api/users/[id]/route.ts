import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await params).id;

    // Convert to BigInt for Prisma query
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photoUrl: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const safeUser = safeJson(user);

    return NextResponse.json(safeUser, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération utilisateur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = (await params).id;
    const body = await request.json();
    const { name, email, password, photoUrl } = body;

    // Prepare update data
    type UserUpdateInput = {
      name?: string;
      email?: string;
      photoUrl?: string;
      password?: string;
    };

    const updateData: UserUpdateInput = {
      name,
      email,
      photoUrl
    };

    // Hash password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photoUrl: true,
      }
    });

    return NextResponse.json(safeJson(updatedUser), { status: 200 });
  } catch (error) {
    console.error("Erreur mise à jour utilisateur:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}