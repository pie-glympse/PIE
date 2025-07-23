import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { message: 'userId est requis' },
        { status: 400 }
      );
    }

    const preferences = await prisma.eventUserPreference.findMany({
      where: {
        userId: BigInt(userId),
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
        tag: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(safeJson(preferences), { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    return NextResponse.json(
      { message: 'Erreur serveur interne' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
