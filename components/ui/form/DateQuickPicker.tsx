"use client";

import { useMemo, useState } from "react";
import {
    buildQuickDateOptions,
    formatDateLabel,
    toDateInputValue,
} from "@/lib/form-datetime";
import {
    chipBaseClass,
    chipDefaultClass,
    chipSelectedClass,
    formErrorClass,
    formHintClass,
    formInputClass,
    formLabelClass,
} from "./form-styles";

type DateQuickPickerProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  error?: string;
  hint?: string;
  multiDay?: boolean;
  onMultiDayChange?: (multiDay: boolean) => void;
  endValue?: string;
  onEndChange?: (value: string) => void;
};

export function DateQuickPicker({
  id = "date",
  label = "Date",
  value,
  onChange,
  min,
  error,
  hint,
  multiDay = false,
  onMultiDayChange,
  endValue = "",
  onEndChange,
}: DateQuickPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const quickOptions = useMemo(() => buildQuickDateOptions(), []);
  const selectedQuick = quickOptions.find((opt) => opt.value === value);

  const pickDate = (dateValue: string) => {
    onChange(dateValue);
    if (!multiDay && onEndChange) onEndChange(dateValue);
    setShowCustom(false);
  };

  return (
    <div id={id}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={formLabelClass}>{label} *</span>
        {onMultiDayChange ? (
          <button
            type="button"
            onClick={() => onMultiDayChange(!multiDay)}
            className="text-body-small font-poppins text-[var(--color-grey-three)] hover:text-[var(--color-text)] underline"
          >
            {multiDay ? "Un seul jour" : "Plusieurs jours"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {quickOptions.map((opt) => {
          const disabled = min ? opt.value < min : false;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => pickDate(opt.value)}
              className={`${chipBaseClass} ${
                value === opt.value ? chipSelectedClass : chipDefaultClass
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          className={`${chipBaseClass} ${
            showCustom || (!selectedQuick && value)
              ? chipSelectedClass
              : chipDefaultClass
          }`}
        >
          Autre date
        </button>
      </div>

      {(showCustom || (!selectedQuick && value)) && (
        <input
          type="date"
          value={value}
          min={min}
          onChange={(e) => pickDate(e.target.value)}
          className={formInputClass}
        />
      )}

      {value && !showCustom && selectedQuick ? (
        <p className={formHintClass}>Sélectionné : {formatDateLabel(value)}</p>
      ) : null}

      {multiDay && onEndChange ? (
        <div className="mt-3">
          <label htmlFor={`${id}-end`} className={formLabelClass}>
            Date de fin
          </label>
          <input
            id={`${id}-end`}
            type="date"
            value={endValue}
            min={value || min || toDateInputValue(new Date())}
            onChange={(e) => onEndChange(e.target.value)}
            className={formInputClass}
          />
        </div>
      ) : null}

      {hint && !error ? <p className={formHintClass}>{hint}</p> : null}
      {error ? <p className={formErrorClass}>{error}</p> : null}
    </div>
  );
}
