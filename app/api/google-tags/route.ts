import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tags = await prisma.googleTag.findMany({
      where: {
        isActive: true,
        displayName: {
          not: null,
        },
      },
      orderBy: {
        displayName: "asc",
      },
      select: {
        id: true,
        techName: true,
        displayName: true,
      },
    });

    return NextResponse.json(
      tags.map((tag) => ({
        ...tag,
        id: tag.id.toString(),
      })),
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
