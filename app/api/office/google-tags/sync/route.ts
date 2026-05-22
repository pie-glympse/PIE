import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOfficeAuthenticated } from "@/lib/officeApiAuth";
import { fetchGooglePlaceTypesFromDocs } from "@/lib/google-tags/sync";

export async function POST(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { types, warnings } = await fetchGooglePlaceTypesFromDocs();
    const existing = await prisma.googleTag.findMany({
      select: { techName: true },
    });

    const existingSet = new Set(existing.map((row) => row.techName));
    const fetchedSet = new Set(types);

    const toCreate = types.filter((techName) => !existingSet.has(techName));
    const toReactivate = types.filter((techName) => existingSet.has(techName));
    const toDeactivate = existing
      .map((row) => row.techName)
      .filter((techName) => !fetchedSet.has(techName));

    if (toCreate.length > 0) {
      await prisma.googleTag.createMany({
        data: toCreate.map((techName) => ({
          techName,
          source: "google-docs",
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }

    if (toReactivate.length > 0) {
      await prisma.googleTag.updateMany({
        where: { techName: { in: toReactivate } },
        data: {
          isActive: true,
          source: "google-docs",
        },
      });
    }

    if (toDeactivate.length > 0) {
      await prisma.googleTag.updateMany({
        where: { techName: { in: toDeactivate } },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      message: "Synchronisation terminée",
      summary: {
        fetched: types.length,
        created: toCreate.length,
        reactivated: toReactivate.length,
        inactivated: toDeactivate.length,
      },
      warnings,
    });
  } catch (error) {
    console.error("Erreur sync google tags:", error);
    return NextResponse.json(
      {
        message: "Erreur lors de la synchronisation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
