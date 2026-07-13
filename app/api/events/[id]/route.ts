import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateETag, isNotModified, addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";
import { enrichEventForClient } from "@/lib/event-public";
import { requireAuthUser } from "@/lib/server-auth";

function safeJson(obj: unknown) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// 🔥 Fonction utilitaire pour récupérer l'id depuis l'URL
function getEventIdFromUrl(req: Request): number | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean); // ["api", "events", "123"]
  const id = segments[segments.length - 1]; // Dernier segment = "123"
  const eventId = Number(id);
  return isNaN(eventId) ? null : eventId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = BigInt(resolvedParams.id);
    const userId = new URL(request.url).searchParams.get("userId");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        selectedGoogleTags: true,
        confirmedGoogleTag: true,
        category: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyId: true,
            photoUrl: true,
          },
        },
        User_Event_createdByIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyId: true,
            photoUrl: true,
          },
        },
        location: true,
        preferences: true,
        photos: true,
        feedbacks: true,
        votes: true,
        notifications: true,
        _count: { select: { users: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    const eventObj = enrichEventForClient(event, userId ?? undefined);
    const eventJson = safeJson(eventObj);

    // Générer un ETag basé sur l'ID de l'événement et son contenu
    const etag = generateETag({ eventId: resolvedParams.id, event: eventJson });

    // Vérifier si le client a déjà la dernière version
    if (isNotModified(request, etag)) {
      return new NextResponse(null, { status: 304 });
    }

    // Le détail d'un événement change (confirmation, lieu retenu, participants) :
    // on revalide systématiquement via l'ETag (304 si inchangé, sinon données
    // fraîches) au lieu de garder 30 min en cache navigateur — sinon après la
    // confirmation, les participants voyaient encore l'ancienne version.
    const response = NextResponse.json(
      { event: eventJson },
      { status: 200 }
    );
    return addCacheHeaders(response, CACHE_STRATEGIES.REVALIDATE, etag);
  } catch (error) {
    console.error("Erreur récupération event:", error);
    return NextResponse.json({ error: "Erreur récupération event" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const eventId = getEventIdFromUrl(req);

  if (eventId === null) {
    return new Response("Invalid event ID", { status: 400 });
  }

  const body = await req.json();

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: body.title,
      },
    });

    return NextResponse.json({ event: safeJson(updatedEvent) });
  } catch (error) {
    return new Response("Event not found or update failed", { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const eventId = BigInt(resolvedParams.id);
    const body = await request.json();

    // Vérifier d'abord si l'événement existe et récupérer son créateur
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { createdById: true },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { message: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Seul le créateur (identifié par la session) peut modifier l'événement
    const auth = await requireAuthUser(request, body.userId);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    if (existingEvent.createdById !== auth.userId) {
      return NextResponse.json(
        { message: "Vous n'êtes pas autorisé à modifier cet événement" },
        { status: 403 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.startTime !== undefined) updateData.startTime = body.startTime ? new Date(body.startTime) : null;
    if (body.endTime !== undefined) updateData.endTime = body.endTime ? new Date(body.endTime) : null;
    if (body.city !== undefined) updateData.city = body.city;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        selectedGoogleTags: true,
        confirmedGoogleTag: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ event: safeJson(updatedEvent) }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la modification de l'événement:", error);
    return NextResponse.json(
      { message: "Erreur lors de la modification de l'événement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const eventId = getEventIdFromUrl(req);

  if (eventId === null) {
    return new Response("Invalid event ID", { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // L'identité vient de la session (cookie JWT), jamais du client
    const auth = await requireAuthUser(req, body.userId);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Vérifier que l'événement existe et récupérer le créateur
    const event = await prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      select: {
        createdById: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le créateur
    if (event.createdById !== auth.userId) {
      return NextResponse.json(
        { error: "Seul le créateur de l'événement peut le supprimer" },
        { status: 403 }
      );
    }

    // Supprimer l'événement
    await prisma.event.delete({
      where: { id: BigInt(eventId) },
    });

    return NextResponse.json("Event deleted", { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'événement" },
      { status: 500 }
    );
  }
}
