import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateETag, isNotModified, addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";

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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
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
        location: true,
        preferences: true,
        photos: true,
        feedbacks: true,
        votes: true,
        notifications: true
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    // Récupérer le créateur de l'événement
    let createdBy = null;
    if (event.createdById) {
      const creator = await prisma.user.findUnique({
        where: { id: event.createdById },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        }
      });
      createdBy = creator;
    }

    // Map Prisma relation field to `createdBy` for API consumers
    const eventObj: any = { ...event, createdBy };
    const eventJson = safeJson(eventObj);

    // Générer un ETag basé sur l'ID de l'événement et son contenu
    const etag = generateETag({ eventId: resolvedParams.id, event: eventJson });

    // Vérifier si le client a déjà la dernière version
    if (isNotModified(request, etag)) {
      return new NextResponse(null, { status: 304 });
    }

    // Créer la réponse avec les headers de cache (semi-statique car peut changer)
    const response = NextResponse.json(
      { event: eventJson },
      { status: 200 }
    );
    return addCacheHeaders(response, CACHE_STRATEGIES.SEMI_STATIC, etag);
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

    // Vérifier que l'utilisateur est le créateur de l'événement
    if (body.userId && existingEvent.createdById !== BigInt(body.userId)) {
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
        tags: true,
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
    // Récupérer le userId depuis le body de la requête
    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
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
    if (event.createdById?.toString() !== userId) {
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
