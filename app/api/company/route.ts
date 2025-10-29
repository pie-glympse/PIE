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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID requis" }, { status: 400 });
    }

    // Récupérer l'utilisateur avec sa company
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: {
        company: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!user.company) {
      return NextResponse.json({ error: "Utilisateur non associé à une company" }, { status: 404 });
    }

    return NextResponse.json(safeJson({
      companyName: user.company.name,
      companyId: user.company.id
    }), { status: 200 });

  } catch (error) {
    console.error("Erreur récupération company:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
