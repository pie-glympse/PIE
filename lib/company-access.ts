import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function getUserCompanyId(
  authUserId: string
): Promise<bigint | null> {
  const u = await prisma.user.findUnique({
    where: { id: BigInt(authUserId) },
    select: { companyId: true },
  });
  return u?.companyId ?? null;
}

/** Returns 403 response if the user's company does not match `companyId`. */
export async function requireSameCompany(
  authUserId: string,
  companyId: string
): Promise<NextResponse | null> {
  const cid = await getUserCompanyId(authUserId);
  if (!cid || cid.toString() !== companyId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return null;
}

export async function getTeamCompanyId(teamId: bigint): Promise<bigint | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { companyId: true },
  });
  return team?.companyId ?? null;
}

/** Returns 403 if team is not in the user's company. */
export async function requireTeamInUserCompany(
  authUserId: string,
  teamId: bigint
): Promise<NextResponse | null> {
  const [userCid, teamCid] = await Promise.all([
    getUserCompanyId(authUserId),
    getTeamCompanyId(teamId),
  ]);
  if (!userCid || !teamCid || userCid !== teamCid) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return null;
}
