"use client";

import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
} from "react";
import Image from "next/image";

export type EventPhoto = {
  id: string;
  photoUrl: string;
  caption?: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  };
};

export type EventDocumentsHandle = {
  openFilePicker: () => void;
};

interface EventDocumentsProps {
  eventId: string;
  userId?: string;
  canUpload: boolean;
  isCreator?: boolean;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 20 * 1024 * 1024;

const EventDocuments = forwardRef<EventDocumentsHandle, EventDocumentsProps>(
  ({ eventId, userId, canUpload, isCreator = false }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [photos, setPhotos] = useState<EventPhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPhotos = useCallback(async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/events/${eventId}/photos?userId=${encodeURIComponent(userId)}`,
        );
        if (!response.ok) {
          throw new Error("Impossible de charger les photos");
        }
        const data = await response.json();
        setPhotos(data.photos || []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des photos");
      } finally {
        setLoading(false);
      }
    }, [eventId, userId]);

    useEffect(() => {
      void fetchPhotos();
    }, [fetchPhotos]);

    useImperativeHandle(ref, () => ({
      openFilePicker: () => inputRef.current?.click(),
    }));

    const uploadFile = async (file: File) => {
      if (!userId || !canUpload) return;

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Type de fichier non autorisé");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError("Fichier trop volumineux (20 MB max)");
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);

        const response = await fetch(`/api/events/${eventId}/photos`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur lors de l'upload");
        }

        const data = await response.json();
        setPhotos((prev) => [data.photo, ...prev]);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Erreur lors de l'upload",
        );
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void uploadFile(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (!canUpload || uploading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) void uploadFile(file);
    };

    const handleDelete = async (photoId: string) => {
      if (!userId) return;
      if (!confirm("Supprimer cette photo ?")) return;

      try {
        const response = await fetch(
          `/api/events/${eventId}/photos/${photoId}?userId=${encodeURIComponent(userId)}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erreur lors de la suppression");
        }
        setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Erreur lors de la suppression",
        );
      }
    };

    const formatDate = (timestamp: string) => {
      const date = new Date(Number(timestamp));
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    return (
      <div className="space-y-6">
        {canUpload && (
          <div
            className={`w-full min-h-[220px] flex flex-col items-center justify-center rounded-lg border-dashed bg-transparent transition-colors ${
              dragActive ? "border-[var(--color-main)] bg-[#FFFBEB]" : ""
            }`}
            style={{
              borderWidth: "5px",
              borderColor: dragActive ? undefined : "#FAFAFA",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-white text-[var(--color-grey-four)] text-body-large font-poppins hover:opacity-90 transition-opacity border-2 border-[var(--color-grey-three)] hover:border-[var(--color-main)] flex items-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: "4px" }}
            >
              <Image
                src="/icons/import.svg"
                alt="Upload"
                width={32}
                height={32}
                sizes="32px"
              />
              {uploading ? "Envoi en cours..." : "Upload"}
            </button>

            <p className="text-body-large font-poppins text-[var(--color-grey-three)] mb-2 text-center">
              Choisissez vos pièces jointes ou glissez-les ici
              <br />
              Max 20 MB
            </p>
          </div>
        )}

        {error && <p className="text-sm font-poppins text-red-600">{error}</p>}

        {loading ? (
          <p className="text-body-large font-poppins text-[var(--color-grey-three)]">
            Chargement des photos...
          </p>
        ) : photos.length === 0 ? (
          <p className="text-body-large font-poppins text-[var(--color-grey-three)] text-center py-8">
            Aucune photo pour cet événement
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => {
              const canDelete =
                userId && (photo.user.id === userId || isCreator);

              return (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-[var(--color-grey-two)] bg-white"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={photo.photoUrl}
                      alt={
                        photo.caption ||
                        `Photo de ${photo.user.firstName} ${photo.user.lastName}`
                      }
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>

                  <div className="p-3">
                    <p className="text-sm font-poppins font-medium text-[var(--color-text)] truncate">
                      {photo.user.firstName} {photo.user.lastName}
                    </p>
                    <p className="text-xs font-poppins text-[var(--color-grey-three)]">
                      {formatDate(photo.createdAt)}
                    </p>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-poppins px-2 py-1 rounded cursor-pointer"
                      aria-label="Supprimer la photo"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

EventDocuments.displayName = "EventDocuments";

export default EventDocuments;
