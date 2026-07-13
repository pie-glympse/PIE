"use client";

type PlaceInfo = {
  name?: string | null;
  address?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  websiteUrl?: string | null;
  placeId?: string | null;
};

type PlaceInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  place: PlaceInfo;
};

// Modale sobre présentant le lieu retenu (nom, adresse, note, liens).
export default function PlaceInfoModal({
  isOpen,
  onClose,
  place,
}: PlaceInfoModalProps) {
  if (!isOpen) return null;

  const mapsUrl = place.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${place.placeId}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl border border-[var(--color-grey-two)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-h3 font-urbanist text-[var(--color-text)]">
            {place.name || "Lieu"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-[var(--color-grey-three)] hover:text-[var(--color-text)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {place.address && (
          <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-3">
            {place.address}
          </p>
        )}

        {place.rating != null && (
          <p className="text-body-small font-poppins text-[var(--color-text)] mb-4">
            <span className="text-yellow-500">★</span> {place.rating.toFixed(1)}
            {place.userRatingsTotal != null && (
              <span className="text-[var(--color-grey-three)]">
                {" "}
                ({place.userRatingsTotal} avis)
              </span>
            )}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {place.websiteUrl && (
            <a
              href={place.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 rounded-md bg-[var(--color-text)] text-white text-body-small font-poppins text-center hover:opacity-90 transition-opacity"
            >
              Voir le site
            </a>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 rounded-md border-2 border-[var(--color-grey-two)] text-[var(--color-text)] text-body-small font-poppins text-center hover:border-[var(--color-text)] transition-colors"
            >
              Voir sur Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
