import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: "Company ID requis" }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: BigInt(companyId)
      },
      include: {
        events: true,
        company: true,
      },
    });

    return NextResponse.json(safeJson(users), { status: 200 });
  } catch (error) {
    console.error("Erreur récupération users:", error);
    return NextResponse.json({ error: "Erreur récupération users" }, { status: 500 });
  }
}
