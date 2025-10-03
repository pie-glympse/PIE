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

// DELETE - Supprimer une team
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params;

    // D'abord, retirer tous les utilisateurs de cette team
    await prisma.user.updateMany({
      where: {
        teamId: BigInt(teamId)
      },
      data: {
        teamId: null
      }
    });

    // Ensuite, supprimer la team
    await prisma.team.delete({
      where: {
        id: BigInt(teamId)
      }
    });

    return NextResponse.json(safeJson({ 
      message: "Team supprimée avec succès"
    }), { status: 200 });
  } catch (error) {
    console.error("Erreur suppression team:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
