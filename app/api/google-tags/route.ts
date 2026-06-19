import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPrincipalGroups } from "@/lib/google-tags/serialize";
import { ensureDefaultGoogleTagGroups } from "@/lib/google-tags/default-groups";
import { ensureDefaultGoogleTagSubGroups } from "@/lib/google-tags/default-sub-groups";

export async function GET() {
  try {
    await ensureDefaultGoogleTagGroups(prisma);
    await ensureDefaultGoogleTagSubGroups(prisma);

    const groups = await prisma.googleTagGroup.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        sortOrder: true,
        isActive: true,
      },
    });

    return NextResponse.json(
      { groups: buildPrincipalGroups(groups) },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur récupération google tags:", error);
    return NextResponse.json(
      { error: "Erreur récupération google tags" },
      { status: 500 },
    );
  }
}
