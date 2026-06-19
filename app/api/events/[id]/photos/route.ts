import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EVENT_PHOTOS_BUCKET, uploadToStorage } from "@/lib/supabase-storage";
import { userCanAccessEventPhotos } from "@/lib/event-photos";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}

function getEventIdFromUrl(request: NextRequest): bigint | null {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const eventIdStr = segments[segments.indexOf("events") + 1];
  if (!eventIdStr) return null;
  try {
    return BigInt(eventIdStr);
  } catch {
    return null;
  }
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 20 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    const eventId = getEventIdFromUrl(request);
    const userId = new URL(request.url).searchParams.get("userId");

    if (!eventId) {
      return NextResponse.json({ error: "eventId invalide" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const userIdBigInt = BigInt(userId);
    const canAccess = await userCanAccessEventPhotos(eventId, userIdBigInt);
    if (!canAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const photos = await prisma.eventsUsersPhoto.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(safeJson({ photos }), { status: 200 });
  } catch (error) {
    console.error("Erreur récupération photos événement:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventId = getEventIdFromUrl(request);
    if (!eventId) {
      return NextResponse.json({ error: "eventId invalide" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const caption = (formData.get("caption") as string | null)?.trim() || null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier reçu" },
        { status: 400 },
      );
    }
    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (20 MB max)" },
        { status: 400 },
      );
    }

    const userIdBigInt = BigInt(userId);
    const canAccess = await userCanAccessEventPhotos(eventId, userIdBigInt);
    if (!canAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const extension = file.name.split(".").pop() || "jpg";
    const randomString = Math.random().toString(36).substring(2, 10);
    const filePath = `${eventId}/${userId}/${Date.now()}-${randomString}.${extension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { publicUrl } = await uploadToStorage({
      bucket: EVENT_PHOTOS_BUCKET,
      filePath,
      buffer,
      contentType: file.type,
    });

    const photo = await prisma.eventsUsersPhoto.create({
      data: {
        userId: userIdBigInt,
        eventId,
        photoUrl: publicUrl,
        caption,
        createdAt: BigInt(Date.now()),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    return NextResponse.json(safeJson({ photo }), { status: 201 });
  } catch (error) {
    console.error("Erreur upload photo événement:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
