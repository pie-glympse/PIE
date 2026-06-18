import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOfficeAuthenticated } from "@/lib/officeApiAuth";
import { serializeGoogleTagGroup } from "@/lib/google-tags/serialize";

type GoogleTagGroupInput = {
  id?: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
};

export async function GET(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const groups = await prisma.googleTagGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(groups.map(serializeGoogleTagGroup));
}

export async function POST(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const groups: GoogleTagGroupInput[] = Array.isArray(body?.groups)
      ? body.groups
      : [];

    if (groups.length === 0) {
      return NextResponse.json(
        { message: "Aucun groupe à sauvegarder" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      groups.map((group) => {
        const name = group.name?.trim();
        if (!name) {
          throw new Error("Nom de groupe manquant");
        }

        if (group.id && !String(group.id).startsWith("new-")) {
          return prisma.googleTagGroup.update({
            where: { id: BigInt(group.id) },
            data: {
              name,
              sortOrder: group.sortOrder ?? 0,
              isActive: group.isActive ?? true,
            },
          });
        }

        return prisma.googleTagGroup.create({
          data: {
            name,
            sortOrder: group.sortOrder ?? 0,
            isActive: group.isActive ?? true,
          },
        });
      }),
    );

    return NextResponse.json({ message: "Groupes sauvegardés" });
  } catch (error) {
    console.error("Erreur sauvegarde google tag groups:", error);
    return NextResponse.json(
      { message: "Erreur lors de la sauvegarde des groupes" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const groupId = body?.id;

    if (!groupId) {
      return NextResponse.json({ message: "id manquant" }, { status: 400 });
    }

    await prisma.googleTagGroup.delete({
      where: { id: BigInt(groupId) },
    });

    return NextResponse.json({ message: "Groupe supprimé" });
  } catch (error) {
    console.error("Erreur suppression google tag group:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du groupe" },
      { status: 500 },
    );
  }
}
