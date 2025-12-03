"use client";

import { useState, useEffect } from "react";
import MainButton from "./ui/MainButton";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [participated, setParticipated] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [dontWantToComment, setDontWantToComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser le formulaire quand la modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setParticipated(null);
      setRating(null);
      setMessage("");
      setDontWantToComment(false);
      setError(null);
    }
  }, [isOpen]);

  const handleParticipationAnswer = (answer: boolean) => {
    setParticipated(answer);
    setError(null);
    // Passer directement à l'étape 2
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    if (participated === null) {
      setError("Veuillez indiquer si vous avez participé à l'événement");
      return;
    }

    setIsSubmitting(true);
    setError(null);

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

  // Contenu de l'étape 1 : Question de participation
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-h2 font-poppins font-semibold text-[var(--color-text)] mb-4">
          Hier a eu lieu l&apos;évènement {eventTitle} et vous y étiez invité !
        </h2>
        <p className="text-body-small font-poppins text-[var(--color-grey-three)]">Y avez-vous participé ?</p>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => handleParticipationAnswer(false)}
          className="flex-1 px-6 py-3 rounded-lg bg-[var(--color-text)] text-white font-poppins text-body-large cursor-pointer hover:opacity-90 transition"
        >
          Non
        </button>
        <button
          type="button"
          onClick={() => handleParticipationAnswer(true)}
          className="flex-1 px-6 py-3 rounded-lg border-2 border-[var(--color-grey-three)] bg-white text-[var(--color-text)] font-poppins text-body-large cursor-pointer hover:border-[var(--color-text)] transition"
        >
          Oui
        </button>
      </div>

      {error && <div className="text-center text-red-600 text-body-small font-poppins">{error}</div>}
    </div>
  );

  // Contenu de l'étape 2 : Note et commentaire
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-h2 font-poppins font-semibold text-[var(--color-text)] mb-4">
          Formidable ! Qu&apos;en avez-vous pensé ?
        </h2>
        <p className="text-body-small font-poppins text-[var(--color-grey-three)]">
          À quel point avez-vous été satisfait de cet évènement ?
        </p>
      </div>

      {/* Note sur 5 étoiles */}
      <div className="flex justify-center gap-2 mb-4">
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
            className="text-4xl transition hover:scale-110 cursor-pointer"
            disabled={dontWantToComment}
          >
            {rating && star <= rating ? "⭐" : "☆"}
          </button>
        ))}
      </div>

      {/* Commentaire */}
      <div>
        <textarea
          value={message}
          onChange={(e) => {
            if (dontWantToComment) {
              setDontWantToComment(false);
            }
            setMessage(e.target.value);
          }}
          disabled={dontWantToComment}
          placeholder="Nous aimerions en connaître les détails..."
          className="w-full px-4 py-3 bg-[var(--color-grey-one)] border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-main)] disabled:cursor-not-allowed font-poppins text-body-small"
          rows={4}
        />
      </div>

      {/* Option "Je ne souhaite pas me prononcer" */}
      <div className="text-center">
        <label className="inline-flex items-center gap-2 cursor-pointer">
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
            className="w-4 h-4 text-[var(--color-main)] border-gray-300 rounded focus:ring-[var(--color-main)]"
          />
          <span className="text-body-small font-poppins text-[var(--color-grey-three)]">
            Je ne souhaite pas me prononcer
          </span>
        </label>
      </div>

      {error && <div className="text-center text-red-600 text-body-small font-poppins">{error}</div>}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-4xl shadow-lg w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Contenu de l'étape actuelle */}
        <div className="mb-6">{currentStep === 1 ? renderStep1() : renderStep2()}</div>

        {/* Bouton principal - uniquement à l'étape 2 */}
        {currentStep === 2 && (
          <div className="flex justify-center mb-4">
            <MainButton
              color="bg-[var(--color-text)] font-poppins text-body-small"
              text={isSubmitting ? "Envoi..." : "Envoyer"}
              onClick={handleSubmit}
            />
          </div>
        )}

        {/* Steppers */}
        <div className="flex justify-center gap-2">
          {[1, 2].map((step) => (
            <div
              key={step}
              className={`h-1 rounded-full transition-all duration-200 ${
                step === currentStep ? "w-10 bg-[var(--color-main)]" : "w-6 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
