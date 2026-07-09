"use client";

import type { FC } from "react";

interface StepperInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Suffixe affiché dans le champ (ex. "km") */
  suffix?: string;
  placeholder?: string;
}

// Champ numérique avec boutons − / + (maquettes "Places maximum" / "Distance maximum")
const StepperInput: FC<StepperInputProps> = ({
  id,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  placeholder,
}) => {
  const numericValue = value === "" ? null : Number(value);

  const clamp = (n: number) => {
    let next = n;
    if (min != null && next < min) next = min;
    if (max != null && next > max) next = max;
    return next;
  };

  const increment = () => {
    const base = numericValue ?? min;
    onChange(String(clamp(base + step)));
  };

  const decrement = () => {
    const base = numericValue ?? min;
    onChange(String(clamp(base - step)));
  };

  return (
    <div className="flex items-stretch w-full border-2 border-[var(--color-grey-two)] rounded bg-white overflow-hidden">
      <button
        type="button"
        onClick={decrement}
        aria-label="Diminuer"
        className="px-4 text-xl font-poppins text-[var(--color-grey-three)] hover:bg-[var(--color-grey-one)] transition-colors"
      >
        −
      </button>
      <div className="flex-1 flex items-center justify-center gap-1">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-2 text-base text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="pr-2 text-body-small font-poppins text-[var(--color-grey-three)]">
            {suffix}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={increment}
        aria-label="Augmenter"
        className="px-4 text-xl font-poppins text-[var(--color-grey-three)] hover:bg-[var(--color-grey-one)] transition-colors"
      >
        +
      </button>
    </div>
  );
};

export default StepperInput;
