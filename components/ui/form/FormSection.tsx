"use client";

import { useState, type ReactNode } from "react";
import {
    formSectionClass,
    formSectionStepClass,
    type FormSectionVariant,
} from "./form-styles";

type FormSectionProps = {
  title: string;
  description?: string;
  step?: number;
  variant?: FormSectionVariant;
  /** No tinted background — fields sit on the page surface */
  plain?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
};

export function FormSection({
  title,
  description,
  step,
  variant = "neutral",
  plain = false,
  defaultOpen = true,
  collapsible = false,
  children,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;

  const sectionSurfaceClass = plain
    ? "mb-6"
    : `rounded-lg p-5 md:p-6 mb-4 ${formSectionClass[variant]}`;

  return (
    <section className={sectionSurfaceClass}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {step != null && (
            <span
              className={`flex-shrink-0 w-7 h-7 rounded-md font-poppins font-semibold text-xs flex items-center justify-center ${formSectionStepClass[variant]}`}
            >
              {step}
            </span>
          )}
          <div>
            <h3 className="text-body-large font-poppins font-semibold text-[var(--color-text)]">
              {title}
            </h3>
            {description ? (
              <p className="text-body-small font-poppins text-[var(--color-grey-three)] mt-0.5">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-body-small font-poppins text-[var(--color-grey-three)] hover:text-[var(--color-text)] underline flex-shrink-0"
          >
            {open ? "Réduire" : "Afficher"}
          </button>
        ) : null}
      </div>
      {isOpen ? <div className="space-y-4">{children}</div> : null}
    </section>
  );
}
