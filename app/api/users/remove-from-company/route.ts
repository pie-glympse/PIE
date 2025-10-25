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

export async function POST(request: Request) {
  try {
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: "Liste d'IDs utilisateur requise" }, { status: 400 });
    }

    // Retirer les utilisateurs de la company (mettre companyId à null)
    const result = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds.map(id => BigInt(id))
        }
      },
      data: {
        companyId: null
      }
    });

    return NextResponse.json(safeJson({ 
      message: `${result.count} utilisateur(s) retiré(s) de la company`,
      count: result.count 
    }), { status: 200 });
  } catch (error) {
    console.error("Erreur lors du retrait des utilisateurs:", error);
    return NextResponse.json({ error: "Erreur lors du retrait des utilisateurs" }, { status: 500 });
  }
}
