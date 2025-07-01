import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    await prisma.event.update({
      where: { id: BigInt(eventId) },
      data: {
        users: {
          connect: { id: BigInt(userId) },
        },
      },
    });

    return NextResponse.json({ message: "User linked to event successfully" });
  } catch (error) {
    console.error("Error linking user to event:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
