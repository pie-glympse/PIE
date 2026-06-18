import { supabaseServer } from "@/lib/supabaseServer";

export const EVENT_PHOTOS_BUCKET = "event-photos";

export function extractFileInfoFromUrl(
  url: string,
): { bucket: string; filename: string } | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!match) return null;

    const bucket = match[1];
    const path = match[2];
    const filename = path.startsWith(`${bucket}/`)
      ? path.substring(bucket.length + 1)
      : path;
    return { bucket, filename };
  } catch {
    return null;
  }
}

export async function deleteFileFromStorage(
  bucket: string,
  filename: string,
): Promise<void> {
  try {
    const { error } = await supabaseServer.storage
      .from(bucket)
      .remove([filename]);
    if (error) {
      console.error(`Erreur suppression fichier ${bucket}/${filename}:`, error);
    }
  } catch (error) {
    console.error(
      `Erreur lors de la suppression du fichier ${bucket}/${filename}:`,
      error,
    );
  }
}

export async function uploadToStorage(params: {
  bucket: string;
  filePath: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ publicUrl: string; path: string }> {
  const { bucket, filePath, buffer, contentType } = params;

  const { error: uploadError } = await supabaseServer.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabaseServer.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!urlData?.publicUrl) {
    throw new Error("Impossible de générer l'URL publique");
  }

  return { publicUrl: urlData.publicUrl, path: filePath };
}
