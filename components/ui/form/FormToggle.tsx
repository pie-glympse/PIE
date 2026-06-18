"use client";

type FormToggleProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
};

export function FormToggle({
  id,
  label,
  checked,
  onChange,
  description,
}: FormToggleProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
        checked
          ? "border-[var(--color-main)] bg-[#FFFBEB]"
          : "border-[var(--color-grey-two)] bg-white hover:border-[var(--color-grey-three)]"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 border-2 border-[var(--color-grey-two)] rounded accent-[var(--color-secondary)]"
      />
      <span className="min-w-0">
        <span className="block text-body-small font-poppins font-medium text-[var(--color-text)]">
          {label}
        </span>
        {description ? (
          <span className="block text-body-small font-poppins text-[var(--color-grey-three)] mt-0.5">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
