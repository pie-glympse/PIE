import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOfficeAuthenticated } from "@/lib/officeApiAuth";
import {
    serializeGoogleTag,
    serializeGoogleTagGroup,
    serializeGoogleTagSubGroup,
} from "@/lib/google-tags/serialize";
import { ensureDefaultGoogleTagGroups } from "@/lib/google-tags/default-groups";
import { ensureDefaultGoogleTagSubGroups } from "@/lib/google-tags/default-sub-groups";

type GoogleTagInput = {
  techName: string;
  displayName?: string | null;
  isActive?: boolean;
  subGroupId?: string | null;
  sortOrder?: number;
};

function sanitizeTechName(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDefaultGoogleTagGroups(prisma);
    await ensureDefaultGoogleTagSubGroups(prisma);

    const [groups, subGroups, tags] = await Promise.all([
      prisma.googleTagGroup.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.googleTagSubGroup.findMany({
        orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.googleTag.findMany({
        orderBy: [
          { subGroupId: "asc" },
          { sortOrder: "asc" },
          { techName: "asc" },
        ],
      }),
    ]);

    return NextResponse.json({
      groups: groups.map(serializeGoogleTagGroup),
      subGroups: subGroups.map(serializeGoogleTagSubGroup),
      tags: tags.map(serializeGoogleTag),
    });
  } catch (error) {
    console.error("Erreur chargement office google tags:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des tags",
      },
      { status: 500 },
    );
  }
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
      return NextResponse.json(
        { message: "Aucune ligne à sauvegarder" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      tags.map((tag) => {
        const techName = sanitizeTechName(tag.techName || "");
        const displayName =
          typeof tag.displayName === "string" ? tag.displayName.trim() : "";

        if (!techName) {
          throw new Error("techName manquant");
        }

        const subGroupId =
          tag.subGroupId && tag.subGroupId !== "null"
            ? BigInt(tag.subGroupId)
            : null;

        return prisma.googleTag.upsert({
          where: { techName },
          update: {
            displayName: displayName || null,
            isActive: tag.isActive ?? true,
            subGroupId,
            sortOrder: tag.sortOrder ?? 0,
          },
          create: {
            techName,
            displayName: displayName || null,
            isActive: tag.isActive ?? true,
            subGroupId,
            sortOrder: tag.sortOrder ?? 0,
          },
        });
      }),
    );

    return NextResponse.json({ message: "Mappings sauvegardés" });
  } catch (error) {
    console.error("Erreur sauvegarde google tags:", error);
    return NextResponse.json(
      { message: "Erreur lors de la sauvegarde" },
      { status: 500 },
    );
  }
}
