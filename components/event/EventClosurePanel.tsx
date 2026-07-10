"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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
  const [isRelaunching, setIsRelaunching] = useState(false);
  const [choosingId, setChoosingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Lieux déjà proposés (cumulés au fil des "Relancer") pour ne pas les revoir
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  // Modale des 5 propositions (ouverte à la clôture, rouvrable via l'icône cadeau)
  const [showProposals, setShowProposals] = useState(false);

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
      setShowProposals(true); // ouverture auto de la modale des propositions
      window.dispatchEvent(new Event("eventsUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsClosing(false);
    }
  };

  const handleRelaunch = async () => {
    if (!user?.id) return;
    setIsRelaunching(true);
    setError(null);
    // On exclut tout ce qui a déjà été proposé (batches précédents + actuel)
    const exclude = new Set(seenIds);
    (status?.proposals ?? []).forEach((p) => exclude.add(p.placeId));
    try {
      const response = await fetch(`/api/events/${eventId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          excludePlaceIds: Array.from(exclude),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data?.noMore) {
          // Fin du catalogue : on repart de zéro au prochain clic
          setSeenIds(new Set());
          setError("Vous avez fait le tour — relancez pour repartir du début.");
          return;
        }
        throw new Error(data?.message || "Erreur lors de la relance");
      }
      (data.proposals ?? []).forEach((p: { placeId: string }) =>
        exclude.add(p.placeId),
      );
      setSeenIds(exclude);
      await fetchStatus();
      window.dispatchEvent(new Event("eventsUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsRelaunching(false);
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
    <>
      {state !== "closed" ? (
        <div className="mt-4 w-full p-5 rounded-xl border-2 border-[var(--color-grey-two)] bg-white">
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
          {error && (
            <p className="mt-3 text-red-500 text-sm font-poppins">{error}</p>
          )}
        </div>
      ) : (
        /* Votes clôturés : icône cadeau (secousse) qui ouvre la modale */
        <button
          type="button"
          onClick={() => setShowProposals(true)}
          className="mt-4 w-full flex items-center gap-4 p-5 rounded-xl border-2 border-[var(--color-grey-two)] bg-white text-left hover:border-[var(--color-main)] transition-colors cursor-pointer"
        >
          <Image
            src="/images/illustration/cadeau.png"
            alt="Propositions de lieux"
            width={56}
            height={56}
            className="animate-gift-shake shrink-0 object-contain"
          />
          <div>
            <p className="text-body-large font-poppins font-medium text-[var(--color-text)]">
              Vos propositions de lieux sont prêtes 🎁
            </p>
            <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
              {status.proposals.length} lieux — cliquez pour choisir le lieu
              final
            </p>
          </div>
        </button>
      )}

      {/* Modale des 5 propositions */}
      {state === "closed" && showProposals && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowProposals(false)}
        >
          <div
            className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-h3 font-urbanist text-[var(--color-text)] mb-1">
                  Choisissez le lieu final
                </h3>
                <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
                  {status.proposals.length} proposition
                  {status.proposals.length > 1 ? "s" : ""} basée
                  {status.proposals.length > 1 ? "s" : ""} sur les votes des
                  participants
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRelaunch}
                  disabled={isRelaunching}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-poppins border-2 transition-colors ${
                    isRelaunching
                      ? "border-[var(--color-grey-two)] text-[var(--color-grey-three)] cursor-not-allowed"
                      : "border-[var(--color-main)] text-[var(--color-main-text)] hover:bg-[var(--color-main)]/10 cursor-pointer"
                  }`}
                  title="Proposer 5 autres lieux"
                >
                  <svg
                    className={`w-4 h-4 ${isRelaunching ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {isRelaunching ? "Génération..." : "Relancer 5 autres"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProposals(false)}
                  aria-label="Fermer"
                  className="p-2 text-[var(--color-grey-three)] hover:text-[var(--color-text)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

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

            {error && (
              <p className="mt-3 text-red-500 text-sm font-poppins">{error}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
