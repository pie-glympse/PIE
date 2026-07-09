import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export type AuthUser = {
  id: bigint;
  email?: string;
  role?: string;
};

function extractToken(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(/;\s*/)) {
    if (part.startsWith("token=")) return part.slice("token=".length);
  }
  return undefined;
}

/** Utilisateur authentifié depuis le cookie JWT (posé par /api/login), ou null. */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = extractToken(request);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET),
    );
    if (!payload?.id) return null;
    return {
      id: BigInt(String(payload.id)),
      email: typeof payload.email === "string" ? payload.email : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
    };
  } catch {
    return null;
  }
}

export type AuthResult =
  | { ok: true; userId: bigint; role?: string }
  | { ok: false; error: string; status: number };

/**
 * Résout l'identité côté serveur : le userId vient de la session, jamais du
 * client. Si le client envoie quand même un userId (compat), il doit
 * correspondre à la session, sinon 403.
 */
export async function requireAuthUser(
  request: Request,
  claimedUserId?: string | number | null,
): Promise<AuthResult> {
  const auth = await getAuthUser(request);
  if (!auth) {
    return { ok: false, error: "Authentification requise", status: 401 };
  }
  if (
    claimedUserId != null &&
    claimedUserId !== "" &&
    BigInt(claimedUserId) !== auth.id
  ) {
    return {
      ok: false,
      error: "L'utilisateur ne correspond pas à la session",
      status: 403,
    };
  }
  return { ok: true, userId: auth.id, role: auth.role };
}
