"use client";

import { useState } from "react";
import Image from "next/image";
import MainButton from "@/components/ui/MainButton";

export type EventVisibility = "public" | "private";

type EventVisibilityStepProps = {
  value: EventVisibility;
  onChange: (value: EventVisibility) => void;
  onContinue: () => void;
};

export function EventVisibilityStep({
  value,
  onChange,
  onContinue,
}: EventVisibilityStepProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const cards: {
    id: EventVisibility;
    label: string;
    bg: string;
    image: string;
  }[] = [
    {
      id: "public",
      label: "Je souhaite organiser un évènement Public",
      bg: "bg-white",
      image: "/images/mascotte/joy.png",
    },
    {
      id: "private",
      label: "Je souhaite organiser un évènement Privé",
      bg: "bg-[#E9F1FE]",
      image: "/images/mascotte/mascotte-nrml.png",
    },
  ];

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-h1 mb-6 text-left font-urbanist text-[var(--color-text)]">
        Créez vos évènements personnalisés !
      </h1>

      <div className="relative flex items-center gap-2 mb-8">
        <p className="text-h3 font-poppins text-[var(--color-grey-three)]">
          Vous souhaitez rendre votre évènement public ou privé ?
        </p>
        <button
          type="button"
          className="w-6 h-6 rounded-full border border-[var(--color-grey-three)] text-[var(--color-grey-three)] text-sm font-medium flex items-center justify-center hover:bg-[var(--color-grey-one)]"
          aria-label="Informations sur les types d'événements"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
        >
          i
        </button>
        {showTooltip && (
          <div
            role="tooltip"
            className="absolute left-0 top-full mt-2 z-20 max-w-md p-4 bg-white border-2 border-[var(--color-grey-two)] rounded-lg shadow-lg text-body-small font-poppins text-[var(--color-text)]"
          >
            Un évènement public peut être rejoint par tous les membres de l&apos;entreprise
            dans la limite des places disponibles. Un évènement privé vous permet
            d&apos;en sélectionner les participants.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {cards.map((card) => {
          const selected = value === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onChange(card.id)}
              className={`relative text-left rounded-2xl border-2 p-6 transition-all ${card.bg} ${
                selected
                  ? "border-[var(--color-main)] shadow-md"
                  : "border-[var(--color-grey-two)] hover:border-[var(--color-main)]"
              }`}
            >
              {selected && (
                <span className="absolute top-4 right-4 text-[var(--color-main)]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                </span>
              )}
              <div className="flex justify-center mb-6 min-h-[140px] items-end">
                <Image
                  src={card.image}
                  alt=""
                  width={160}
                  height={160}
                  className="object-contain"
                />
              </div>
              <p className="text-body-large font-poppins text-[var(--color-text)] text-center">
                {card.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className="md:w-1/5 w-full">
        <MainButton
          color="bg-[var(--color-text)] font-poppins text-body-large"
          text="Continuer"
          type="button"
          onClick={onContinue}
        />
      </div>
    </div>
  );
}

