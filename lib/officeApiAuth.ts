import { NextRequest } from "next/server";
import { OFFICE_COOKIE_NAME, verifyOfficeToken } from "@/lib/officeAuth";

export async function isOfficeAuthenticated(request: NextRequest) {
  const token = request.cookies.get(OFFICE_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyOfficeToken(token);
}
