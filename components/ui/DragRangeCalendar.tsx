"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactElement, PointerEvent as ReactPointerEvent } from "react";

type DragRangeCalendarProps = {
  /** Date de début sélectionnée (YYYY-MM-DD) */
  startDate?: string;
  /** Date de fin sélectionnée (YYYY-MM-DD) */
  endDate?: string;
  /** Appelé à chaque changement de plage (start <= end, format YYYY-MM-DD) */
  onChange: (start: string, end: string) => void;
  /** Première date sélectionnable (défaut : aujourd'hui) */
  minDate?: string;
  /** Nombre de mois affichés à partir du mois courant (défaut 12) */
  monthsCount?: number;
  /** true : la sélection se limite à un seul jour (clic) ; false : plage par glissement */
  singleDay?: boolean;
};

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const pad = (n: number) => String(n).padStart(2, "0");
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayKey = () => {
  const t = new Date();
  return toKey(t.getFullYear(), t.getMonth(), t.getDate());
};

// Calendrier « à la Gcalendar » (mois en scroll horizontal, cases compactes)
// mais interactif : clic-glissé pour sélectionner une plage de dates.
export default function DragRangeCalendar({
  startDate,
  endDate,
  onChange,
  minDate,
  monthsCount = 12,
  singleDay = false,
}: DragRangeCalendarProps) {
  const min = minDate || todayKey();
  const today = todayKey();
  const [anchor, setAnchor] = useState<string | null>(null); // début du glissement

  // Fin de sélection quand on relâche n'importe où
  useEffect(() => {
    const stop = () => setAnchor(null);
    document.addEventListener("pointerup", stop);
    return () => document.removeEventListener("pointerup", stop);
  }, []);

  const months = useMemo(() => {
    const now = new Date();
    const list: { month: number; year: number }[] = [];
    for (let i = 0; i < monthsCount; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push({ month: d.getMonth(), year: d.getFullYear() });
    }
    return list;
  }, [monthsCount]);

  const inRange = (key: string) =>
    !!startDate && !!endDate && key >= startDate && key <= endDate;

  const select = (key: string, from: string) => {
    if (singleDay) {
      onChange(key, key);
      return;
    }
    const [s, e] = key < from ? [key, from] : [from, key];
    onChange(s, e);
  };

  const handlePointerDown = (
    e: ReactPointerEvent,
    key: string,
    disabled: boolean,
  ) => {
    if (disabled) return;
    // Libérer la capture implicite : sinon en tactile le glissement ne
    // déclenche pas onPointerEnter sur les autres cases.
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setAnchor(key);
    onChange(key, key);
  };

  const handlePointerEnter = (key: string, disabled: boolean) => {
    if (disabled || anchor === null || singleDay) return;
    select(key, anchor);
  };

  const renderMonth = (month: number, year: number): ReactElement => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Décalage lundi-first : getDay() 0=dimanche → (x+6)%7
    const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const cells: ReactElement[] = [];

    for (let i = 0; i < firstOffset; i++) {
      cells.push(<div key={`e-${i}`} className="w-8 h-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const key = toKey(year, month, day);
      const disabled = key < min;
      const selected = key === startDate || key === endDate || inRange(key);
      const isToday = key === today;

      cells.push(
        <button
          type="button"
          key={key}
          disabled={disabled}
          onPointerDown={(e) => handlePointerDown(e, key, disabled)}
          onPointerEnter={() => handlePointerEnter(key, disabled)}
          className={[
            "w-8 h-8 rounded-md text-xs font-medium flex items-center justify-center transition-colors select-none touch-none",
            disabled
              ? "text-gray-300 cursor-not-allowed"
              : selected
                ? "bg-[var(--color-main)] text-white"
                : "text-[var(--color-text)] hover:bg-[var(--color-main)]/20 cursor-pointer",
            !selected && isToday && !disabled
              ? "ring-1 ring-[var(--color-main)]"
              : "",
          ].join(" ")}
        >
          {day}
        </button>,
      );
    }

    return (
      <div
        key={`${year}-${month}`}
        className="min-w-[248px] shrink-0 snap-start p-3 rounded-lg"
      >
        <h3 className="text-sm font-semibold text-left mb-2 text-gray-700">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={i}
              className="w-8 h-5 text-[10px] font-medium text-gray-400 flex items-center justify-center"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>
    );
  };

  return (
    <div
      className="flex gap-4 overflow-x-auto snap-x pb-2 scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {months.map((m) => renderMonth(m.month, m.year))}
    </div>
  );
}
