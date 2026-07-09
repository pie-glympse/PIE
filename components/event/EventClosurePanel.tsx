"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

type Proposal = {
  id: string;
  placeId: string;
  name: string;
  address: string;
  rating?: number | null;
  userRatingsTotal?: number | null;
  websiteUrl?: string | null;
  score: number;
  rank: number;
  chosen: boolean;
};

type ClosureStatus = {
  state?: string;
  isSpecificPlace: boolean;
  isCreator: boolean;
  participantCount: number;
  respondedCount: number;
  canClose: boolean;
  proposals: Proposal[];
};

type EventClosurePanelProps = {
  eventId: string;
  isCreator: boolean;
  eventState?: string;
  isSpecificPlace?: boolean;
  /** Appelé quand le lieu final est confirmé (le parent recharge l'événement) */
  onConfirmed: () => void;
};

// Panneau créateur : progression des réponses, clôture des votes (dès 1 réponse)
// puis choix du lieu final parmi les 5 propositions Google Places.
export default function EventClosurePanel({
  eventId,
  isCreator,
  eventState,
  isSpecificPlace,
  onConfirmed,
}: EventClosurePanelProps) {
  const { user } = useUser();
  const [status, setStatus] = useState<ClosureStatus | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [choosingId, setChoosingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const state = (status?.state ?? eventState ?? "").toLowerCase();

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(
        `/api/events/${eventId}/close?userId=${encodeURIComponent(user.id)}`,
      );
      if (!response.ok) return;
      setStatus(await response.json());
    } catch (err) {
      console.error("Erreur statut clôture:", err);
    }
  }, [eventId, user?.id]);

  useEffect(() => {
    void fetchStatus();

    const onPreferencesUpdated = () => void fetchStatus();
    window.addEventListener("preferencesUpdated", onPreferencesUpdated);
    return () =>
      window.removeEventListener("preferencesUpdated", onPreferencesUpdated);
  }, [fetchStatus]);

  const handleClose = async () => {
    if (!user?.id) return;
    setIsClosing(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Erreur lors de la clôture des votes");
      }
      await fetchStatus();
      window.dispatchEvent(new Event("eventsUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsClosing(false);
    }
  };

  const handleChoose = async (proposalId: string) => {
    if (!user?.id) return;
    setChoosingId(proposalId);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/choose-place`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, proposalId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Erreur lors du choix du lieu");
      }
      window.dispatchEvent(new Event("eventsUpdated"));
      onConfirmed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setChoosingId(null);
    }
  };

  // Rien à afficher : lieu précis, non-créateur, ou événement déjà confirmé
  if (isSpecificPlace || !isCreator || state === "confirmed") return null;
  if (!status) return null;

  const renderStars = (rating?: number | null) => {
    if (!rating) return null;
    return (
      <span className="text-sm text-[var(--color-grey-three)] font-poppins">
        <span className="text-yellow-500">★</span> {rating.toFixed(1)}
      </span>
    );
  };

  return (
    <div className="mt-4 w-full p-5 rounded-xl border-2 border-[var(--color-grey-two)] bg-white">
      {state !== "closed" ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div>
              <p className="text-body-large font-poppins font-medium text-[var(--color-text)]">
                Votes des participants
              </p>
              <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
                {status.respondedCount}/{status.participantCount} participant
                {status.participantCount > 1 ? "s ont" : " a"} répondu au
                questionnaire
                {status.respondedCount === 0 &&
                  " — au moins une réponse est nécessaire pour clôturer"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={!status.canClose || isClosing}
              className={`px-5 py-2.5 rounded-md font-poppins text-white transition-opacity ${
                status.canClose && !isClosing
                  ? "bg-[var(--color-main)] hover:opacity-90 cursor-pointer"
                  : "bg-[var(--color-grey-two)] cursor-not-allowed"
              }`}
            >
              {isClosing
                ? "Génération des propositions..."
                : "Clôturer les votes"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-body-large font-poppins font-medium text-[var(--color-text)] mb-1">
            Votes clôturés — choisissez le lieu final
          </p>
          <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-4">
            {status.proposals.length} proposition
            {status.proposals.length > 1 ? "s" : ""} basée
            {status.proposals.length > 1 ? "s" : ""} sur les votes des
            participants
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {status.proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="flex flex-col justify-between rounded-xl border-2 border-[var(--color-grey-two)] p-4 hover:border-[var(--color-main)] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-body-large font-semibold font-urbanist text-[var(--color-text)]">
                      {proposal.rank}. {proposal.name}
                    </h4>
                    {renderStars(proposal.rating)}
                  </div>
                  <p className="text-body-small font-poppins text-[var(--color-grey-three)] mb-2">
                    {proposal.address}
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    {proposal.userRatingsTotal != null && (
                      <span className="text-xs font-poppins text-[var(--color-grey-three)]">
                        {proposal.userRatingsTotal} avis
                      </span>
                    )}
                    {proposal.websiteUrl && (
                      <a
                        href={proposal.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-poppins underline text-[var(--color-text)]"
                      >
                        Voir le site
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${proposal.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-poppins underline text-[var(--color-text)]"
                    >
                      Google Maps
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChoose(proposal.id)}
                  disabled={choosingId !== null}
                  className={`w-full px-4 py-2 rounded-md font-poppins text-white transition-opacity ${
                    choosingId === null
                      ? "bg-[var(--color-text)] hover:opacity-90 cursor-pointer"
                      : "bg-[var(--color-grey-two)] cursor-not-allowed"
                  }`}
                >
                  {choosingId === proposal.id
                    ? "Confirmation..."
                    : "Choisir ce lieu"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {error && (
        <p className="mt-3 text-red-500 text-sm font-poppins">{error}</p>
      )}
    </div>
  );
}
