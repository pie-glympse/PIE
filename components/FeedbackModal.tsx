"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  userId: string;
  notificationId?: string;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  userId,
  notificationId,
}: FeedbackModalProps) {
  const [participated, setParticipated] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [dontWantToComment, setDontWantToComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setParticipated(null);
      setRating(null);
      setMessage("");
      setDontWantToComment(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (participated === null) {
      setError("Veuillez indiquer si vous avez participé à l'événement");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          eventId,
          participated,
          rating: dontWantToComment ? null : rating,
          message: dontWantToComment ? null : message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la soumission du feedback");
      }

      // Déclencher l'événement pour mettre à jour les notifications
      window.dispatchEvent(new Event("notificationsUpdated"));

      // Fermer la modal
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Votre avis compte !</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Fermer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Donnez votre avis sur l&apos;événement &quot;{eventTitle}&quot;
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question participation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avez-vous participé à cet événement ?
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setParticipated(true)}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                  participated === true
                    ? "bg-green-100 border-green-500 text-green-700"
                    : "bg-white border-gray-300 text-gray-700 hover:border-green-300"
                }`}
              >
                OUI
              </button>
              <button
                type="button"
                onClick={() => setParticipated(false)}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                  participated === false
                    ? "bg-red-100 border-red-500 text-red-700"
                    : "bg-white border-gray-300 text-gray-700 hover:border-red-300"
                }`}
              >
                NON
              </button>
            </div>
          </div>

          {/* Note sur 5 étoiles */}
          {participated !== null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notez cet événement (optionnel)
              </label>
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      if (dontWantToComment) {
                        setDontWantToComment(false);
                      }
                      setRating(star);
                    }}
                    className="text-3xl transition hover:scale-110"
                    disabled={dontWantToComment}
                  >
                    {rating && star <= rating ? "⭐" : "☆"}
                  </button>
                ))}
                {rating && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating}/5
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Commentaire */}
          {participated !== null && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  if (dontWantToComment) {
                    setDontWantToComment(false);
                  }
                  setMessage(e.target.value);
                }}
                disabled={dontWantToComment}
                placeholder="Partagez votre expérience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={4}
              />
            </div>
          )}

          {/* Option "Je ne souhaite pas me prononcer" */}
          {participated !== null && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontWantToComment}
                  onChange={(e) => {
                    setDontWantToComment(e.target.checked);
                    if (e.target.checked) {
                      setRating(null);
                      setMessage("");
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Je ne souhaite pas me prononcer
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || participated === null}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

