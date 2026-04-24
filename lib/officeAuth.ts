import { SignJWT, jwtVerify } from "jose";

export const OFFICE_COOKIE_NAME = "office_token";

const OFFICE_USER = "admin";
const OFFICE_PASSWORD = "admin";
const OFFICE_TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const OFFICE_JWT_SECRET = process.env.OFFICE_JWT_SECRET || "office-dev-secret";

function getOfficeSecretKey() {
  return new TextEncoder().encode(OFFICE_JWT_SECRET);
}

export function validateOfficeCredentials(username: string, password: string) {
  return username === OFFICE_USER && password === OFFICE_PASSWORD;
}

export async function createOfficeToken() {
  return new SignJWT({ scope: "office" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${OFFICE_TOKEN_TTL_SECONDS}s`)
    .sign(getOfficeSecretKey());
}

export async function verifyOfficeToken(token: string) {
  try {
    const result = await jwtVerify(token, getOfficeSecretKey());
    return result.payload.scope === "office";
  } catch {
    return false;
  }
}

export function getOfficeCookieMaxAge() {
  return OFFICE_TOKEN_TTL_SECONDS;
}
