// app/api/login/route.ts (Next.js API route)
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // mettre dans .env

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  // Créer un token JWT avec id, email, name, role
const token = jwt.sign(
  {
    id: user.id.toString(), // ✅ converti en string
    email: user.email,
    name: user.name,
    role: user.role
  },
  JWT_SECRET,
  { expiresIn: "7d" }
);

// Si login OK
const response = NextResponse.json({
  user: { id: user.id.toString(), email: user.email, name: user.name, role: user.role },
});

response.cookies.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 7 jours
  path: '/',
});

return response;
}
