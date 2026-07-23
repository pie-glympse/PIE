"use client";
import { useRef, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, User as UserIcon, FileText } from "lucide-react";
import PublicEventParticipateButton from "@/components/event/PublicEventParticipateButton";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
}

interface EventCardProps {
  eventId: string;
  title: string;
  date: string;
  description?: string;
  documentCount?: number;
  participants?: Participant[];
  backgroundUrl: string;
  backgroundSize?: number;
  /** Couleur de la catégorie de l'event (accent visuel de la carte). */
  accentColor?: string;
  className?: string;
  dropdownOpen?: boolean;
  onDropdownToggle?: () => void;
  isAuthorized?: boolean;
  onShare?: () => void;
  onPreferences?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
  showPreferencesButton?: boolean;
  state?: string;
  canLeave?: boolean;
  onLeave?: () => void;
  isCreator?: boolean;
  isPublic?: boolean;
  participantCount?: number;
  maxParticipants?: number | null;
  isParticipant?: boolean;
  hasVoted?: boolean;
  isFull?: boolean;
  joinLoading?: boolean;
  onParticipate?: () => void;
  hideParticipateButton?: boolean;
  isNew?: boolean;
  // Cas invitation : affiche les boutons Décliner / Accepter
  isInvited?: boolean;
  inviteLoading?: boolean;
  onAcceptInvite?: () => void;
  onDeclineInvite?: () => void;
}

export default function EventCard({
  eventId,
  title,
  date,
  description,
  documentCount = 0,
  participants = [],
  backgroundUrl,
  backgroundSize = 200,
  accentColor,
  className = "",
  dropdownOpen = false,
  onDropdownToggle,
  isAuthorized = false,
  onShare,
  onDelete,
  onCopy,
  onEdit,
  showPreferencesButton = false,
  state,
  canLeave = false,
  onLeave,
  isCreator = false,
  isPublic = false,
  participantCount = 0,
  maxParticipants = null,
  isParticipant = false,
  hasVoted = false,
  isFull = false,
  joinLoading = false,
  onParticipate,
  hideParticipateButton = false,
  isNew = false,
  isInvited = false,
  inviteLoading = false,
  onAcceptInvite,
  onDeclineInvite,
}: EventCardProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const displayParticipants = participants.slice(0, 5);
  const remainingCount = participants.length - 5;

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        dropdownOpen
      ) {
        onDropdownToggle?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, onDropdownToggle]);

  const needsVote =
    (isParticipant || isCreator) &&
    showPreferencesButton &&
    state?.toLowerCase() !== "confirmed";

  const handleCardClick = () => {
    if (needsVote) {
      router.push(
        `/event-preferences/${eventId}?eventTitle=${encodeURIComponent(title)}`,
      );
      return;
    }
    router.push(`/events/${eventId}`);
  };

  const handlePreferencesClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    router.push(
      `/event-preferences/${eventId}?eventTitle=${encodeURIComponent(title)}`,
    );
    onDropdownToggle?.();
  };

  // Barre de progression — 3 étapes du cycle de vie de l'event :
  //   1. créé (à rejoindre / voter)   2. l'utilisateur a voté   3. votes clôturés par le créateur
  const TOTAL_STEPS = 3;
  const votesClosed = state?.toLowerCase() === "confirmed";
  const filledSteps = votesClosed ? 3 : hasVoted ? 2 : 1;

  const formattedDate = new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Accent de couleur par catégorie (fallback : couleur principale du thème).
  const accent = accentColor || "var(--color-main)";

  return (
    <div
      className={`group relative rounded-xl border bg-white p-6 transition-all duration-300 overflow-hidden ${
        needsVote
          ? "cursor-pointer border-[var(--color-secondary)] event-card-needs-vote"
          : "cursor-pointer border-gray-200 hover:shadow-lg"
      } ${isNew ? "event-card-spawn" : ""} ${className}`}
      onClick={handleCardClick}
    >
      {needsVote && (
        <div
          className="absolute top-0 right-0 z-30 pointer-events-none"
          aria-hidden="true"
        >
          <div className="bg-[var(--color-secondary)] text-white text-xs font-semibold font-poppins uppercase tracking-wide px-4 py-1.5 rounded-bl-xl shadow-md">
            Voter
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div
        className={`relative z-10 flex flex-col h-full transition-all duration-300 ${
          needsVote ? "group-hover:opacity-25 group-hover:scale-[0.98]" : ""
        }`}
      >
        {/* Barre de progression (étape de l'event) */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{
                backgroundColor:
                  i < filledSteps ? accent : "var(--color-grey-two)",
              }}
            />
          ))}
        </div>

        {/* Date */}
        <p className="mt-3 text-sm text-[var(--color-grey-three)]">
          {formattedDate}
        </p>

        {/* Icône + titre */}
        <div className="mt-1 flex items-center gap-2 min-w-0">
          {backgroundUrl && (
            <Image
              src={backgroundUrl}
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="w-6 h-6 object-contain flex-shrink-0"
            />
          )}
          <h3 className="text-lg font-semibold text-[var(--color-text)] truncate">
            {title}
          </h3>
          {isPublic && (
            <span className="ml-1 inline-flex w-fit flex-shrink-0 px-2 py-0.5 rounded-full bg-[#E9F1FE] text-xs font-poppins text-[var(--color-text)]">
              Public
            </span>
          )}
        </div>

        {/* Description (affichée seulement si fournie) */}
        {description && (
          <p className="mt-2 text-sm text-[var(--color-grey-three)] line-clamp-2">
            {description}
          </p>
        )}

        {/* Séparateur + footer, poussés en bas de la carte */}
        <div className="mt-auto pt-4">
          <hr className="border-[var(--color-grey-two)]" />

          <div className="mt-3 flex items-center justify-between">
            {/* Avatars + bouton d'ajout (réservé au créateur d'un event privé) */}
            <div className="flex items-center">
              {isCreator && !isPublic && (
                <button
                  type="button"
                  aria-label="Inviter des participants"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.();
                  }}
                  className="w-9 h-9 mr-2 flex items-center justify-center rounded-full border border-dashed border-[var(--color-grey-three)] text-[var(--color-grey-three)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              )}

              <div className="flex -space-x-3">
                {displayParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="w-9 h-9 rounded-full border-2 border-white bg-[var(--color-grey-two)] overflow-hidden relative"
                    title={`${participant.firstName} ${participant.lastName}`}
                  >
                    {participant.photoUrl &&
                    participant.photoUrl.trim() !== "" ? (
                      <Image
                        src={participant.photoUrl}
                        alt={`Photo de profil de ${participant.firstName} ${participant.lastName}`}
                        width={36}
                        height={36}
                        className="rounded-full object-cover w-full h-full"
                        sizes="36px"
                        quality={75}
                      />
                    ) : null}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="w-9 h-9 z-10 rounded-full border-2 border-white bg-[var(--color-grey-two)] flex items-center justify-center">
                    <span className="text-xs text-[var(--color-grey-three)] font-medium">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Compteurs participants / documents */}
            <div className="flex items-center gap-3 text-[var(--color-grey-three)]">
              <span className="flex items-center gap-1 text-sm">
                <UserIcon size={16} />
                {participantCount || participants.length}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <FileText size={16} />
                {documentCount}
              </span>
            </div>
          </div>

          {/* Bouton d'action selon l'étape de l'event */}
          {votesClosed ? (
            /* 3. Le créateur a clôturé les votes */
            <button
              type="button"
              disabled
              className="w-full py-3 px-4 mt-4 font-poppins text-body-large rounded-lg bg-[var(--color-grey-two)] text-[var(--color-grey-three)] cursor-not-allowed"
            >
              Complet
            </button>
          ) : hasVoted ? (
            /* 2. L'utilisateur a voté */
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/events/${eventId}`);
              }}
              className="w-full py-3 px-4 mt-4 font-poppins text-body-large rounded-lg bg-[var(--color-text)] text-white hover:opacity-90 transition-colors cursor-pointer"
            >
              Voir
            </button>
          ) : isInvited ? (
            /* 1b. Invitation privée en attente : Décliner / Accepter */
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={inviteLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeclineInvite?.();
                }}
                className="px-4 py-3 font-poppins text-body-large text-[var(--color-text)] rounded-lg hover:bg-[var(--color-grey-one)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Décliner
              </button>
              <button
                type="button"
                disabled={inviteLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onAcceptInvite?.();
                }}
                className="flex-1 py-3 px-4 font-poppins text-body-large rounded-lg bg-[var(--color-text)] text-white hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {inviteLoading ? "Chargement..." : "Accepter"}
              </button>
            </div>
          ) : (
            /* 1a. Event public créé : Participer (ou Complet si plein) */
            isPublic &&
            !hideParticipateButton && (
              <PublicEventParticipateButton
                participantCount={participantCount}
                maxParticipants={maxParticipants}
                isParticipant={isParticipant}
                isCreator={isCreator}
                isFull={isFull}
                isPublic={isPublic}
                loading={joinLoading}
                onParticipate={onParticipate}
                size="card"
              />
            )
          )}
        </div>
      </div>

      {needsVote && (
        <>
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 pointer-events-none md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-all duration-300">
            <button
              type="button"
              onClick={handlePreferencesClick}
              className="vote-action-button px-6 py-3 bg-[var(--color-text)] text-white font-poppins text-body-large rounded-lg shadow-lg hover:bg-[var(--color-secondary)] hover:scale-105 transition-all duration-200 cursor-pointer pointer-events-auto"
            >
              Voter mes préférences
            </button>
            <span className="text-xs font-poppins text-[var(--color-grey-three)] md:hidden">
              Obligatoire avant de consulter l&apos;événement
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-3 z-20 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <p className="text-center text-xs font-poppins text-[var(--color-grey-three)]">
              Cliquez pour voter vos préférences
            </p>
          </div>
        </>
      )}

    </div>
  );
}
