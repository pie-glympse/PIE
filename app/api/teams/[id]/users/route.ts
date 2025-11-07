import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET - Récupérer les utilisateurs d'une team
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;

    const users = await prisma.user.findMany({
      where: {
        teamId: BigInt(teamId)
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json(safeJson(users), { status: 200 });
  } catch (error) {
    console.error("Erreur récupération utilisateurs team:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Ajouter des utilisateurs à une team
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: "Liste d'IDs utilisateur requise" }, { status: 400 });
    }

    // Ajouter les utilisateurs à la team
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds.map(id => BigInt(id))
        }
      },
      data: {
        teamId: BigInt(teamId)
      }
    });

    return NextResponse.json(safeJson({ 
      message: `${result.count} utilisateur(s) ajouté(s) à la team`,
      count: result.count 
    }), { status: 200 });
  } catch (error) {
    console.error("Erreur ajout utilisateurs team:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Retirer des utilisateurs d'une team
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: "Liste d'IDs utilisateur requise" }, { status: 400 });
    }

    // Retirer les utilisateurs de la team (mettre teamId à null)
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds.map(id => BigInt(id))
        },
        teamId: BigInt(teamId)
      },
      data: {
        teamId: null
      }
    });

    return NextResponse.json(safeJson({ 
      message: `${result.count} utilisateur(s) retiré(s) de la team`,
      count: result.count 
    }), { status: 200 });
  } catch (error) {
    console.error("Erreur retrait utilisateurs team:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
