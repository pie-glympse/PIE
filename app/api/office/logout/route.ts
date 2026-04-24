import { NextResponse } from "next/server";
import { OFFICE_COOKIE_NAME } from "@/lib/officeAuth";

export async function POST() {
  const response = NextResponse.json({ message: "Déconnecté" });
  response.cookies.set(OFFICE_COOKIE_NAME, "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
  });
  return response;
}
