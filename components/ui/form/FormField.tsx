"use client";

import type { ReactNode } from "react";
import {
    formErrorClass,
    formHintClass,
    formInputClass,
    formLabelClass,
} from "./form-styles";

type FormFieldProps = {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children?: ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={formLabelClass}>
        {label}
        {required ? " *" : ""}
      </label>
      {children ??
        (id ? <input id={id} className={formInputClass} readOnly /> : null)}
      {hint && !error ? <p className={formHintClass}>{hint}</p> : null}
      {error ? <p className={formErrorClass}>{error}</p> : null}
    </div>
  );
}

export { formInputClass };
