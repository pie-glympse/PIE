import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    console.log('[API Company] Request pour userId:', userId);

    if (!userId) {
      return NextResponse.json({ error: "User ID requis" }, { status: 400 });
    }

    // Récupérer l'utilisateur avec son entreprise
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: {
        company: true
      }
    });

    console.log('[API Company] User trouvé:', user ? 'Oui' : 'Non');
    console.log('[API Company] CompanyId:', user?.companyId?.toString());
    console.log('[API Company] Company:', user?.company ? 'Oui' : 'Non');

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!user.company) {
      return NextResponse.json({ error: "Utilisateur non associé à une entreprise" }, { status: 404 });
    }

    return NextResponse.json(safeJson({
      companyName: user.company.name,
      companyId: user.company.id
    }), { status: 200 });

  } catch (error) {
    console.error("Erreur récupération entreprise:", error);
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
