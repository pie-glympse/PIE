import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function safeJson(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        events: true,
      },
    });

    return NextResponse.json(safeJson(users), { status: 200 });
  } catch (error) {
    console.error("Erreur récupération users:", error);
    return NextResponse.json({ error: "Erreur récupération users" }, { status: 500 });
  }
}
