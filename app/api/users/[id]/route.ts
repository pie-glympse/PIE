import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabaseServer";

const prisma = new PrismaClient();

function safeJson(obj: unknown) {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value)));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;

    // Récupérer l'utilisateur avec tous les champs disponibles
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Construire la réponse avec les champs nécessaires
    const userData = {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      companyId: user.companyId?.toString() || null,
      hasSeenOnboarding: user.hasSeenOnboarding ?? false,
      photoUrl: user.photoUrl || "",
      bannerUrl: user.bannerUrl || "",
    };

    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error("Erreur récupération utilisateur:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction helper pour extraire le bucket et le chemin du fichier depuis une URL Supabase
function extractFileInfoFromUrl(url: string): { bucket: string; filename: string } | null {
  try {
    // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{filename}
    // Peut aussi être: .../{bucket}/{bucket}/{filename} pour les anciens uploads
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    if (match) {
      const bucket = match[1];
      const path = match[2];
      // Si le chemin commence par le nom du bucket (ancien format), on l'enlève
      const filename = path.startsWith(`${bucket}/`) ? path.substring(bucket.length + 1) : path;
      return { bucket, filename };
    }
    return null;
  } catch {
    return null;
  }
}

// Fonction helper pour supprimer un fichier de Supabase Storage
async function deleteFileFromStorage(bucket: string, filename: string): Promise<void> {
  try {
    const { error } = await supabaseServer.storage.from(bucket).remove([filename]);

    if (error) {
      console.error(`Erreur suppression fichier ${bucket}/${filename}:`, error);
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier ${bucket}/${filename}:`, error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { firstName, lastName, email, password, photoUrl, bannerUrl } = body;

    // Récupérer l'utilisateur actuel pour obtenir les anciennes URLs
    const currentUser = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: {
        photoUrl: true,
        bannerUrl: true,
      },
    });

    const updateData: {
      firstName: string;
      lastName: string;
      email: string;
      password?: string;
      photoUrl?: string;
      bannerUrl?: string;
    } = {
      firstName,
      lastName,
      email,
    };

    // Hash password if provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update photoUrl if provided
    if (photoUrl !== undefined) {
      // Supprimer l'ancienne photo si elle existe et est différente de la nouvelle
      if (currentUser?.photoUrl && currentUser.photoUrl !== photoUrl && currentUser.photoUrl.trim() !== "") {
        const oldFileInfo = extractFileInfoFromUrl(currentUser.photoUrl);
        if (oldFileInfo) {
          await deleteFileFromStorage(oldFileInfo.bucket, oldFileInfo.filename);
        }
      }
      updateData.photoUrl = photoUrl;
    }

    // Update bannerUrl if provided
    if (bannerUrl !== undefined) {
      // Supprimer l'ancienne bannière si elle existe et est différente de la nouvelle
      if (currentUser?.bannerUrl && currentUser.bannerUrl !== bannerUrl && currentUser.bannerUrl.trim() !== "") {
        const oldFileInfo = extractFileInfoFromUrl(currentUser.bannerUrl);
        if (oldFileInfo) {
          await deleteFileFromStorage(oldFileInfo.bucket, oldFileInfo.filename);
        }
      }
      updateData.bannerUrl = bannerUrl;
    }

    const updatedUser = await prisma.user.update({
      where: { id: BigInt(userId) },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        photoUrl: true,
        bannerUrl: true,
      },
    });

    return NextResponse.json(safeJson(updatedUser), { status: 200 });
  } catch (error) {
    console.error("Erreur mise à jour utilisateur:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
