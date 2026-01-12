import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// GET - Récupérer toutes les teams d'une company
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    console.log('[API Teams] Request pour companyId:', companyId);

    if (!companyId) {
      return NextResponse.json({ error: "Company ID requis" }, { status: 400 });
    }

    const teams = await prisma.team.findMany({
      where: {
        companyId: BigInt(companyId)
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('[API Teams] Nombre de teams trouvées:', teams.length);
    console.log('[API Teams] Teams:', teams.map(t => ({ id: t.id.toString(), name: t.name, usersCount: t.users.length })));

    return NextResponse.json(safeJson(teams), { status: 200 });
  } catch (error) {
    console.error("Erreur récupération teams:", error);
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST - Créer une nouvelle team
export async function POST(request: Request) {
  try {
    const { name, companyId, userIds } = await request.json();

    if (!name || !companyId) {
      return NextResponse.json({ error: "Nom de la team et Company ID requis" }, { status: 400 });
    }

    // Créer la team
    const team = await prisma.team.create({
      data: {
        name,
        companyId: BigInt(companyId)
      }
    });

    // Si des utilisateurs sont fournis, les assigner à la team
    if (userIds && userIds.length > 0) {
      await prisma.user.updateMany({
        where: {
          id: {
            in: userIds.map((id: string) => BigInt(id))
          }
        },
        data: {
          teamId: team.id
        }
      });
    }

    // Récupérer la team avec ses utilisateurs
    const teamWithUsers = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        company: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(safeJson(teamWithUsers), { status: 201 });
  } catch (error) {
    console.error("Erreur création team:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
