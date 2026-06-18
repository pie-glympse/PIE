export const formInputClass =
  "w-full px-4 py-2.5 text-base font-poppins text-[var(--color-text)] bg-white border border-[var(--color-grey-two)] rounded-lg transition-colors placeholder:text-[var(--color-grey-three)] focus:outline-none focus:border-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-main)]";

export const formLabelClass =
  "block mb-1.5 text-body-small font-poppins font-medium text-[var(--color-text)]";

export const formHintClass =
  "mt-1 text-body-small font-poppins text-[var(--color-grey-three)]";

export const formErrorClass =
  "mt-1 text-body-small font-poppins text-[var(--color-secondary)]";

export const chipBaseClass =
  "px-3 py-2 rounded-lg border font-poppins text-body-small transition-colors cursor-pointer select-none";

export const chipSelectedClass =
  "bg-[var(--color-main)] text-[var(--color-text)] border-[var(--color-main)]";

export const chipDefaultClass =
  "bg-white text-[var(--color-text)] border-[var(--color-grey-two)] hover:border-[var(--color-main)]";

export type FormSectionVariant =
  | "neutral"
  | "main"
  | "tertiary"
  | "sky"
  | "secondary";

/** Flat section surfaces — solid Glyms tints, no blur */
export const formSectionClass: Record<FormSectionVariant, string> = {
  neutral:
    "bg-[var(--color-grey-one)] border-l-4 border-l-[var(--color-grey-three)]",
  main: "bg-[#FFFBEB] border-l-4 border-l-[var(--color-main)]",
  tertiary: "bg-[#FDF0FF] border-l-4 border-l-[var(--color-tertiary)]",
  sky: "bg-[#E9F1FE] border-l-4 border-l-[#7BA7E8]",
  secondary: "bg-[#FFF0F0] border-l-4 border-l-[var(--color-secondary)]",
};

export const formSectionStepClass: Record<FormSectionVariant, string> = {
  neutral: "bg-[var(--color-grey-three)] text-white",
  main: "bg-[var(--color-main)] text-[var(--color-text)]",
  tertiary: "bg-[var(--color-tertiary)] text-white",
  sky: "bg-[#7BA7E8] text-white",
  secondary: "bg-[var(--color-secondary)] text-white",
};
