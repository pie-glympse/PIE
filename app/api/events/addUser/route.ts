import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { eventId, userId } = req.body;

  try {
    await prisma.eventUserPreference.create({
      data: {
        eventId: BigInt(eventId),
        userId: BigInt(userId),
        preferredDate: new Date(), // à adapter si tu veux que l'utilisateur choisisse
        tagId: BigInt(0), // Remplace 0 par la valeur appropriée ou récupère-la du body si nécessaire
      },
    });
    res.status(200).json({ message: "User added to event." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}
