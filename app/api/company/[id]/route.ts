import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateETag, isNotModified, addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: {
        id: BigInt(id),
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const companyData = {
      id: company.id.toString(),
      name: company.name,
    };

    const etag = generateETag(companyData);

    // Vérifier si le client a déjà la dernière version
    if (isNotModified(request, etag)) {
      return new NextResponse(null, { status: 304 });
    }

    // Créer la réponse avec les headers de cache
    const response = NextResponse.json(companyData, { status: 200 });
    return addCacheHeaders(response, CACHE_STRATEGIES.STATIC_DATA, etag);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}
