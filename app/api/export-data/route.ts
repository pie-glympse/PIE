import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function safeJson(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      include: {
        company: true,
        team: true,
        preferences: { include: { event: { select: { id: true, title: true } } } },
        events: { select: { id: true, title: true, startDate: true, endDate: true, location: true } },
        feedbacks: true,
        notifications: { orderBy: { createdAt: "desc" }, take: 50 },
        PointsHistory: { orderBy: { createdAt: "desc" } },
        UserBadge: { include: { Badge: true } },
        blacklistedPlaces: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const exportData = safeJson({
      exportDate: new Date().toISOString(),
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        points: user.points,
        photoUrl: user.photoUrl,
        bannerUrl: user.bannerUrl,
        hasSeenOnboarding: user.hasSeenOnboarding,
      },
      company: user.company ? { id: user.company.id, name: user.company.name } : null,
      team: user.team ? { id: user.team.id, name: user.team.name } : null,
      events: user.events,
      preferences: user.preferences,
      feedbacks: user.feedbacks,
      notifications: user.notifications,
      pointsHistory: user.PointsHistory,
      badges: user.UserBadge.map((ub) => ({ ...ub.Badge, obtainedAt: ub.unlockedAt })),
      blacklistedPlaces: user.blacklistedPlaces,
    });

    // TODO: envoyer exportData par email (sera géré par un collègue)
    console.log(`[export-data] Export généré pour userId=${userId}`);

    return NextResponse.json({ success: true, data: exportData });
  } catch (err) {
    console.error("[/api/export-data] Exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
