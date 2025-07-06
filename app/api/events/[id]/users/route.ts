import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

function getEventIdFromUrl(req: NextRequest): bigint | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const id = segments[segments.length - 1];
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventId = getEventIdFromUrl(request);
    if (!eventId) {
      return NextResponse.json({ message: "Invalid event ID" }, { status: 400 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 400 });
    }

    await prisma.event.update({
      where: { id: eventId },
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
