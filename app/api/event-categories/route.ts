import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const toJson = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );

// Catégories d'événement (Gastronomie, Culture, Divertissement, Sport)
// utilisées par le step 2 du flux de création.
export async function GET() {
  try {
    const categories = await prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ categories: toJson(categories) }, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération catégories:", error);
    return NextResponse.json(
      { error: "Erreur récupération catégories" },
      { status: 500 },
    );
  }
}
