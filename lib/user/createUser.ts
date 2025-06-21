// lib/user/createUser.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

interface CreateUserParams {
  email: string;
  password: string;
  name?: string;
  role?: "ADMIN" | "STANDARD";
}

export async function createUser({ email, password, name, role = "STANDARD" }: CreateUserParams) {
  if (!email || !password) {
    throw new Error("Email et mot de passe requis");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Utilisateur déjà existant");
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: name ?? "Utilisateur_" + Math.floor(Math.random() * 10000),
      role,
      photoUrl: "https://via.placeholder.com/150",
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
