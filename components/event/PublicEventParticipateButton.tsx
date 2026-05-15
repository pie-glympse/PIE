"use client";

import type { MouseEvent } from "react";

type PublicEventParticipateButtonProps = {
  participantCount: number;
  maxParticipants: number | null;
  isParticipant: boolean;
  isCreator?: boolean;
  isFull: boolean;
  isPublic: boolean;
  loading?: boolean;
  onParticipate?: (e: MouseEvent) => void;
  className?: string;
  size?: "card" | "detail";
};

export function getParticipateLabel(
  isPublic: boolean,
  isParticipant: boolean,
  isFull: boolean,
  participantCount: number,
  maxParticipants: number | null,
): string | null {
  if (!isPublic) return null;
  if (isParticipant) return "Déjà inscrit";
  if (isFull) return "Complet";
  if (maxParticipants != null) {
    return `Participer (${participantCount}/${maxParticipants})`;
  }
  return "Participer";
}

export default function PublicEventParticipateButton({
  participantCount,
  maxParticipants,
  isParticipant,
  isCreator = false,
  isFull,
  isPublic,
  loading = false,
  onParticipate,
  className = "",
  size = "card",
}: PublicEventParticipateButtonProps) {
  if (!isPublic || isCreator) return null;

  const label = getParticipateLabel(
    isPublic,
    isParticipant,
    isFull,
    participantCount,
    maxParticipants,
  );
  if (!label) return null;

  const disabled = isParticipant || isFull || loading;
  const isCard = size === "card";

  const base =
    "w-full font-poppins text-body-large rounded-lg transition-colors flex items-center justify-center";
  const sizing = isCard ? "py-3 px-4 mt-4" : "py-2.5 px-6";
  const variant = disabled
    ? "bg-[var(--color-grey-two)] text-[var(--color-grey-three)] cursor-not-allowed"
    : "bg-[var(--color-text)] text-white hover:opacity-90 cursor-pointer";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onParticipate?.(e);
      }}
      className={`${base} ${sizing} ${variant} ${className}`}
    >
      {loading ? "Chargement..." : label}
    </button>
  );
}
