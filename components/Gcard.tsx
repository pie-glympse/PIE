"use client";
import { useRef, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  participants?: Participant[];
  backgroundUrl: string;
  backgroundSize?: number;
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
  isFull?: boolean;
  joinLoading?: boolean;
  onParticipate?: () => void;
  hideParticipateButton?: boolean;
  isNew?: boolean;
}

export default function EventCard({
  eventId,
  title,
  date,
  participants = [],
  backgroundUrl,
  backgroundSize = 200,
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
  isFull = false,
  joinLoading = false,
  onParticipate,
  hideParticipateButton = false,
  isNew = false,
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

  // ✅ Fonction pour obtenir la couleur de la pastille selon l'état
  const getStateColor = (eventState: string) => {
    switch (eventState?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-green-500";
      case "planned":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

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
        className={`relative z-10 transition-all duration-300 ${
          needsVote ? "group-hover:opacity-25 group-hover:scale-[0.98]" : ""
        }`}
      >
        <div className="flex">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            {isPublic && (
              <span className="inline-flex w-fit px-2 py-0.5 rounded-full bg-[#E9F1FE] text-xs font-poppins text-[var(--color-text)]">
                Public
              </span>
            )}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
          </div>

          {/* Container pour la pastille d'état et le menu */}
          <div className="ml-auto flex items-center gap-2">
            {/* ✅ Pastille d'état */}
            {state && (
              <div
                className={`w-3 h-3 rounded-full ${getStateColor(state)}`}
              ></div>
            )}
          </div>
        </div>

        {/* Date */}
        <p className="text-sm text-gray-500 mb-4 drop-shadow">
          {new Date(date).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>

        {/* Avatars des participants - adaptés selon la hauteur */}
        <div
          className={`flex items-center gap-2 ${className?.includes("h-24") || className?.includes("h-20") ? "scale-50 origin-left" : ""}`}
        >
          {participants.length > 0 ? (
            <>
              <div className="flex -space-x-3">
                {displayParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gray-300 overflow-hidden relative"
                    title={`${participant.firstName} ${participant.lastName}`}
                  >
                    {participant.photoUrl &&
                    participant.photoUrl.trim() !== "" ? (
                      <Image
                        src={participant.photoUrl}
                        alt={`Photo de profil de ${participant.firstName} ${participant.lastName}`}
                        width={40}
                        height={40}
                        className="rounded-full object-cover w-full h-full"
                        sizes="40px"
                        quality={75}
                      />
                    ) : null}
                  </div>
                ))}

                {/* Affichage du nombre restant si plus de 5 participants */}
                {remainingCount > 0 && (
                  <div className="w-10 h-10 z-10 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-600 font-medium">
                      +{remainingCount}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p
              className={`text-gray-500 italic ${className?.includes("h-24") || className?.includes("h-20") ? "text-xs" : "text-sm"}`}
            >
              Encore aucun participant
            </p>
          )}
        </div>

        {isPublic && !hideParticipateButton && (
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
        )}
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

      {/* Container pour l'image d'arrière-plan avec overflow-hidden */}
      <div
        className={`absolute inset-0 overflow-hidden rounded-xl pointer-events-none transition-all duration-300 ${
          needsVote ? "group-hover:opacity-20 group-hover:scale-105" : ""
        }`}
        style={{ zIndex: 1 }}
      >
        <Image
          src={backgroundUrl}
          alt=""
          aria-hidden="true"
          className="absolute right-[-25px] bottom-[-25px]"
          width={backgroundSize}
          height={200}
          style={{
            objectFit: "contain",
          }}
          sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
          loading="lazy"
        />
      </div>
    </div>
  );
}
