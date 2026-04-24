import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

function decodePayload(payload: JWTPayload): AuthUser | null {
  const id = payload.id;
  const email = payload.email;
  if (typeof id !== "string" || typeof email !== "string") {
    return null;
  }
  return {
    id,
    email,
    firstName: typeof payload.firstName === "string" ? payload.firstName : undefined,
    lastName: typeof payload.lastName === "string" ? payload.lastName : undefined,
    role: typeof payload.role === "string" ? payload.role : undefined,
  };
}

/**
 * Reads and verifies the JWT from the `token` httpOnly cookie.
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthUser | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return decodePayload(payload);
  } catch {
    return null;
  }
}

/**
 * Same as getAuthenticatedUser but returns a 401 JSON response if unauthenticated.
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthUser | NextResponse> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return user;
}

/**
 * Ensures the authenticated user matches the given user id (e.g. from URL).
 */
export function requireSameUser(
  authUser: AuthUser,
  userId: string | bigint | number
): NextResponse | null {
  const expected = String(userId);
  if (authUser.id !== expected) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return null;
}
