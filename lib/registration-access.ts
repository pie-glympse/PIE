import { SignJWT, jwtVerify } from "jose";

export const REGISTRATION_ACCESS_COOKIE = "glyms_registration_access";
const REGISTRATION_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24;

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "supersecretkey";
  return new TextEncoder().encode(secret);
}

export async function createRegistrationAccessToken(
  stripeSessionId: string,
): Promise<string> {
  return new SignJWT({
    type: "registration",
    stripeSessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${REGISTRATION_ACCESS_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyRegistrationAccessToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (
      payload.type === "registration" &&
      typeof payload.stripeSessionId === "string"
    );
  } catch {
    return false;
  }
}

export function registrationAccessCookieOptions(token: string) {
  return {
    name: REGISTRATION_ACCESS_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REGISTRATION_ACCESS_MAX_AGE_SECONDS,
  };
}
