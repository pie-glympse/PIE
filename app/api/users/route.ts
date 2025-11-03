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
    const companyId = searchParams.get('companyId');

    console.log('[API Users] Request pour companyId:', companyId);

    if (!companyId) {
      return NextResponse.json({ error: "Company ID requis" }, { status: 400 });
    }

    // Optimisé : Sélectionner uniquement les champs nécessaires
    const users = await prisma.user.findMany({
      where: {
        companyId: BigInt(companyId)
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        teamId: true, // ✅ Nécessaire pour filtrer les utilisateurs déjà dans des équipes
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    console.log('[API Users] Nombre d\'utilisateurs trouvés:', users.length);

    return NextResponse.json(safeJson(users), { status: 200 });
  } catch (error) {
    console.error("Erreur récupération users:", error);
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    return NextResponse.json({ 
      error: "Erreur récupération users",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
