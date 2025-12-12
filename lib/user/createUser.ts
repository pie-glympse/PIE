// lib/user/createUser.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface CreateUserParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: "ADMIN" | "STANDARD";
}

export async function createUser({ email, password, firstName, lastName, role = "STANDARD" }: CreateUserParams) {
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
      firstName: firstName ?? "Utilisateur_" + Math.floor(Math.random() * 10000),
      lastName: lastName ?? "Utilisateur_" + Math.floor(Math.random() * 10000),
      role,
      photoUrl: "",
    },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}
