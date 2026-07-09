"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import MainButton from "@/components/ui/MainButton";

export type EventCategoryChoice =
  | { kind: "category"; categoryId: string; slug: string }
  | { kind: "specific" };

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

type EventCategoryStepProps = {
  value: EventCategoryChoice | null;
  onChange: (value: EventCategoryChoice) => void;
  onContinue: () => void;
};

// Mascotte par catégorie (slug) — même style de cards que EventVisibilityStep
const CATEGORY_IMAGES: Record<string, string> = {
  gastronomie: "/images/mascotte/afterwork.png",
  culture: "/images/mascotte/magic.png",
  divertissement: "/images/mascotte/game.png",
  sport: "/images/mascotte/sport.png",
};

const CATEGORY_BG: Record<string, string> = {
  gastronomie: "bg-white",
  culture: "bg-[#E9F1FE]",
  divertissement: "bg-[#E9F1FE]",
  sport: "bg-white",
};

export function EventCategoryStep({
  value,
  onChange,
  onContinue,
}: EventCategoryStepProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/event-categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isSelected = (choice: EventCategoryChoice) => {
    if (!value) return false;
    if (value.kind === "specific") return choice.kind === "specific";
    return choice.kind === "category" && choice.categoryId === value.categoryId;
  };

  const RadioIndicator = ({ selected }: { selected: boolean }) => (
    <span
      aria-hidden
      className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center transition-colors ${
        selected
          ? "border-[var(--color-main)]"
          : "border-[var(--color-grey-two)]"
      }`}
    >
      {selected && (
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-main)]" />
      )}
    </span>
  );

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-h1 mb-6 text-left font-urbanist text-[var(--color-text)]">
        Créez vos évènements personnalisés !
      </h1>
      <p className="text-h3 mb-8 font-poppins text-[var(--color-grey-three)]">
        Sélectionnez le type d&apos;évènement correspondant
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-main)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
          {categories.map((category) => {
            const choice: EventCategoryChoice = {
              kind: "category",
              categoryId: category.id,
              slug: category.slug,
            };
            const selected = isSelected(choice);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onChange(choice)}
                aria-pressed={selected}
                className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
                  CATEGORY_BG[category.slug] ?? "bg-white"
                } ${
                  selected
                    ? "border-[var(--color-main)] shadow-md"
                    : "border-[var(--color-grey-two)] hover:border-[var(--color-main)]"
                }`}
              >
                <div className="flex justify-center mb-4 min-h-[110px] items-end">
                  <Image
                    src={
                      CATEGORY_IMAGES[category.slug] ??
                      "/images/mascotte/base.png"
                    }
                    alt=""
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-body-large font-poppins text-[var(--color-text)] text-center">
                    {category.name}
                  </p>
                  <RadioIndicator selected={selected} />
                </div>
              </button>
            );
          })}

          {/* Branche « lieu précis » : l'activité est déjà décidée */}
          <button
            type="button"
            onClick={() => onChange({ kind: "specific" })}
            aria-pressed={value?.kind === "specific"}
            className={`relative text-left rounded-2xl border-2 p-5 transition-all bg-white ${
              value?.kind === "specific"
                ? "border-[var(--color-main)] shadow-md"
                : "border-[var(--color-grey-two)] hover:border-[var(--color-main)]"
            }`}
          >
            <div className="flex justify-center mb-4 min-h-[110px] items-end">
              <Image
                src="/images/mascotte/mascotte-nrml.png"
                alt=""
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <p className="text-body-large font-poppins text-[var(--color-text)] text-center">
                Je sais ce que je veux
              </p>
              <RadioIndicator selected={value?.kind === "specific"} />
            </div>
          </button>
        </div>
      )}

      <div className="md:w-1/5 w-full">
        <MainButton
          color="bg-[var(--color-text)] font-poppins text-body-large"
          text="Suivant"
          type="button"
          onClick={onContinue}
          disabled={!value}
        />
      </div>
    </div>
  );
}
