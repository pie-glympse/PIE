import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOfficeAuthenticated } from "@/lib/officeApiAuth";

type GoogleTagInput = {
  techName: string;
  displayName?: string | null;
  isActive?: boolean;
};

function sanitizeTechName(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const tags = await prisma.googleTag.findMany({
    orderBy: { techName: "asc" },
    select: {
      id: true,
      techName: true,
      displayName: true,
      isActive: true,
      source: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    tags.map((tag) => ({
      ...tag,
      id: tag.id.toString(),
    })),
  );
}

export async function POST(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const tags: GoogleTagInput[] = Array.isArray(body?.tags) ? body.tags : [];

    if (tags.length === 0) {
      return NextResponse.json({ message: "Aucune ligne à sauvegarder" }, { status: 400 });
    }

    await prisma.$transaction(
      tags.map((tag) => {
        const techName = sanitizeTechName(tag.techName || "");
        const displayName = typeof tag.displayName === "string" ? tag.displayName.trim() : "";

        if (!techName) {
          throw new Error("techName manquant");
        }

        return prisma.googleTag.upsert({
          where: { techName },
          update: {
            displayName: displayName || null,
            isActive: tag.isActive ?? true,
          },
          create: {
            techName,
            displayName: displayName || null,
            isActive: tag.isActive ?? true,
          },
        });
      }),
    );

    return NextResponse.json({ message: "Mappings sauvegardés" });
  } catch (error) {
    console.error("Erreur sauvegarde google tags:", error);
    return NextResponse.json({ message: "Erreur lors de la sauvegarde" }, { status: 500 });
  }
}
