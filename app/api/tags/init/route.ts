import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const tags = [
      { id: BigInt(1), name: "Restauration" },
      { id: BigInt(2), name: "Afterwork" },
      { id: BigInt(3), name: "Team Building" },
      { id: BigInt(4), name: "Séminaire" },
      { id: BigInt(5), name: "Sport" },
      { id: BigInt(6), name: "Autre" },
    ];

    // Utiliser upsert pour créer ou mettre à jour les tags
    for (const tag of tags) {
      await prisma.tag.upsert({
        where: { id: tag.id },
        update: { name: tag.name },
        create: { id: tag.id, name: tag.name },
      });
    }

    return NextResponse.json({ 
      message: "Tags initialisés avec succès",
      tags: tags.map(tag => ({ id: tag.id.toString(), name: tag.name }))
    });
  } catch (error) {
    console.error("Erreur lors de l'initialisation des tags:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation des tags" },
      { status: 500 }
    );
  }
}
