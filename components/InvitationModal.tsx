"use client";

import React, { useState } from "react";
import MainButton from "./ui/MainButton";
import Image from "next/image";

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  creatorName: string;
  userId: string;
  notificationId?: string;
  onResponse?: (accepted: boolean) => void;
}

export default function InvitationModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  creatorName,
  userId,
  notificationId,
  onResponse,
}: InvitationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResponse = async (accepted: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/invitation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action: accepted ? "accept" : "decline",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la réponse à l'invitation");
      }

      // Marquer la notification comme lue si elle existe
      if (notificationId) {
        try {
          await fetch(`/api/notifications/${notificationId}`, {
            method: "PATCH",
          });
        } catch (err) {
          console.error("Erreur lors du marquage de la notification:", err);
        }
      }

      // Déclencher l'événement pour mettre à jour les notifications
      window.dispatchEvent(new Event("notificationsUpdated"));

      // Appeler le callback si fourni
      if (onResponse) {
        onResponse(accepted);
      }

      // Fermer la modale
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réponse");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-4xl shadow-lg w-full max-w-xl p-6 relative">
        {/* Bouton de fermeture (croix) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--color-grey-three)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Image de fond */}
        <div className="w-full h-[200px] bg-[#E9F1FE] rounded-2xl flex items-center justify-center mb-6">
          <Image
            src="/images/mascotte/joy_1.png"
            alt="Invitation"
            width={200}
            height={200}
            className="object-contain"
          />
        </div>

        {/* Contenu */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-h2 font-urbanist text-[var(--color-text)] mb-3">
              Invitation à un événement
            </h2>
            <p className="text-body-large font-poppins text-[var(--color-grey-three)]">
              <span className="font-semibold text-[var(--color-text)]">
                {creatorName}
              </span>{" "}
              vous a invité à l&apos;événement{" "}
              <span className="font-semibold text-[var(--color-text)]">
                &quot;{eventTitle}&quot;
              </span>
            </p>
          </div>

          {error && (
            <div className="text-center text-red-600 text-body-small font-poppins">
              {error}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-col gap-3">
            <MainButton
              color="bg-[var(--color-text)] font-poppins text-body-large"
              text={isSubmitting ? "Envoi..." : "Accepter l'invitation"}
              onClick={() => handleResponse(true)}
              disabled={isSubmitting}
            />
            <button
              onClick={() => handleResponse(false)}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg border-2 border-[var(--color-grey-three)] bg-white text-[var(--color-text)] font-poppins text-body-large cursor-pointer hover:border-[var(--color-text)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Envoi..." : "Décliner l'invitation"}
            </button>
          </div>

          {/* Note sur la fermeture */}
          <p className="text-center text-body-small font-poppins text-[var(--color-grey-three)]">
            Vous pouvez fermer cette fenêtre et répondre plus tard depuis vos
            notifications
          </p>
        </div>
      </div>
    </div>
  );
}

