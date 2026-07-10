import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    deleteFileFromStorage,
    extractFileInfoFromUrl,
} from "@/lib/supabase-storage";
import { userCanDeleteEventPhoto } from "@/lib/event-photos";

function getIdsFromUrl(request: NextRequest): {
  eventId: bigint;
  photoId: bigint;
} | null {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  const eventsIndex = segments.indexOf("events");
  const photosIndex = segments.indexOf("photos");

  if (eventsIndex === -1 || photosIndex === -1) return null;

  try {
    return {
      eventId: BigInt(segments[eventsIndex + 1]),
      photoId: BigInt(segments[photosIndex + 1]),
    };
  } catch {
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ids = getIdsFromUrl(request);
    const userId = new URL(request.url).searchParams.get("userId");

    if (!ids) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 400 },
      );
    }
    if (!userId) {
      return NextResponse.json({ error: "userId manquant" }, { status: 400 });
    }

    const userIdBigInt = BigInt(userId);
    const photo = await prisma.eventsUsersPhoto.findFirst({
      where: {
        id: ids.photoId,
        eventId: ids.eventId,
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo non trouvée" }, { status: 404 });
    }

    const canDelete = await userCanDeleteEventPhoto({
      eventId: ids.eventId,
      userId: userIdBigInt,
      photoUserId: photo.userId,
    });

    if (!canDelete) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const fileInfo = extractFileInfoFromUrl(photo.photoUrl);
    if (fileInfo) {
      await deleteFileFromStorage(fileInfo.bucket, fileInfo.filename);
    }

    await prisma.eventsUsersPhoto.delete({
      where: { id: photo.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erreur suppression photo événement:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
