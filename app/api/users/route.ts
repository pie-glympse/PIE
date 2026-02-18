import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateETag, isNotModified, addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

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

    const usersJson = safeJson(users);
    
    // Générer un ETag basé sur le companyId et les utilisateurs
    const etag = generateETag({ companyId, users: usersJson });

    // Vérifier si le client a déjà la dernière version
    if (isNotModified(request, etag)) {
      return new NextResponse(null, { status: 304 });
    }

    // Créer la réponse avec les headers de cache (semi-statique car peut changer)
    const response = NextResponse.json(usersJson, { status: 200 });
    return addCacheHeaders(response, CACHE_STRATEGIES.SEMI_STATIC, etag);
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
  }
}
