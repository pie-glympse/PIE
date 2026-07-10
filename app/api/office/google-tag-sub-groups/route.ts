import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isOfficeAuthenticated } from "@/lib/officeApiAuth";
import { serializeGoogleTagSubGroup } from "@/lib/google-tags/serialize";

type GoogleTagSubGroupInput = {
  id?: string;
  name: string;
  groupId: string;
  sortOrder?: number;
  isActive?: boolean;
};

export async function GET(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subGroups = await prisma.googleTagSubGroup.findMany({
    orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(subGroups.map(serializeGoogleTagSubGroup));
}

export async function POST(request: NextRequest) {
  const isAuthed = await isOfficeAuthenticated(request);
  if (!isAuthed) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const subGroups: GoogleTagSubGroupInput[] = Array.isArray(body?.subGroups)
      ? body.subGroups
      : [];

    if (subGroups.length === 0) {
      return NextResponse.json(
        { message: "Aucun sous-groupe à sauvegarder" },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      subGroups.map((subGroup) => {
        const name = subGroup.name?.trim();
        if (!name) {
          throw new Error("Nom de sous-groupe manquant");
        }
        if (!subGroup.groupId) {
          throw new Error("groupId manquant");
        }

        if (subGroup.id && !String(subGroup.id).startsWith("new-")) {
          return prisma.googleTagSubGroup.update({
            where: { id: BigInt(subGroup.id) },
            data: {
              name,
              groupId: BigInt(subGroup.groupId),
              sortOrder: subGroup.sortOrder ?? 0,
              isActive: subGroup.isActive ?? true,
            },
          });
        }

        return prisma.googleTagSubGroup.create({
          data: {
            name,
            groupId: BigInt(subGroup.groupId),
            sortOrder: subGroup.sortOrder ?? 0,
            isActive: subGroup.isActive ?? true,
          },
        });
      }),
    );

    return NextResponse.json({ message: "Sous-groupes sauvegardés" });
  } catch (error) {
    console.error("Erreur sauvegarde google tag sub groups:", error);
    return NextResponse.json(
      { message: "Erreur lors de la sauvegarde des sous-groupes" },
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
    const subGroupId = body?.id;

    if (!subGroupId) {
      return NextResponse.json({ message: "id manquant" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.googleTag.updateMany({
        where: { subGroupId: BigInt(subGroupId) },
        data: { subGroupId: null },
      }),
      prisma.googleTagSubGroup.delete({
        where: { id: BigInt(subGroupId) },
      }),
    ]);

    return NextResponse.json({ message: "Sous-groupe supprimé" });
  } catch (error) {
    console.error("Erreur suppression google tag sub group:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du sous-groupe" },
      { status: 500 },
    );
  }
}
