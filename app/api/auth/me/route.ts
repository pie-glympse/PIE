import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addCacheHeaders, CACHE_STRATEGIES } from "@/lib/cache-utils";

// Un 401 ne doit jamais non plus être servi depuis un cache partagé.
function unauthorized() {
  return addCacheHeaders(
    NextResponse.json({ user: null }, { status: 401 }),
    CACHE_STRATEGIES.PRIVATE_STRICT,
  );
}

export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(authUser.id) },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      companyId: true,
    },
  });

  if (!user) {
    return unauthorized();
  }

  // Route PRIVÉE : données du compte connecté.
  // Interdiction stricte de mise en cache partagée (PASS/MISS) pour éviter
  // qu'un utilisateur reçoive les données d'un autre depuis un cache CDN.
  const response = NextResponse.json({
    user: {
      id: user.id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId?.toString() || null,
    },
  });
  return addCacheHeaders(response, CACHE_STRATEGIES.PRIVATE_STRICT);
}
