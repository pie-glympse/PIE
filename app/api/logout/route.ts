import { NextResponse } from "next/server";
import { REGISTRATION_ACCESS_COOKIE } from "@/lib/registration-access";

function clearCookie(name: string) {
  return {
    name,
    value: "",
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };
}

export async function POST() {
  const response = NextResponse.json({ message: "Déconnecté avec succès" });

  const tokenCookie = clearCookie("token");
  response.cookies.set(tokenCookie.name, tokenCookie.value, {
    expires: tokenCookie.expires,
    path: tokenCookie.path,
    httpOnly: tokenCookie.httpOnly,
    secure: tokenCookie.secure,
    sameSite: tokenCookie.sameSite,
  });

  const registrationCookie = clearCookie(REGISTRATION_ACCESS_COOKIE);
  response.cookies.set(registrationCookie.name, registrationCookie.value, {
    expires: registrationCookie.expires,
    path: registrationCookie.path,
    httpOnly: registrationCookie.httpOnly,
    secure: registrationCookie.secure,
    sameSite: registrationCookie.sameSite,
  });

  return response;
}
