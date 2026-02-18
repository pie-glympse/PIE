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
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    const tagsJson = safeJson(tags);
    const etag = generateETag(tagsJson);

    // Vérifier si le client a déjà la dernière version
    if (isNotModified(request, etag)) {
      return new NextResponse(null, { status: 304 });
    }

    // Créer la réponse avec les headers de cache
    const response = NextResponse.json(tagsJson, { status: 200 });
    return addCacheHeaders(response, CACHE_STRATEGIES.STATIC_DATA, etag);
  } catch (error) {
    console.error("Erreur récupération tags:", error);
    return NextResponse.json({ error: "Erreur récupération tags" }, { status: 500 });
  }
}