"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ReactElement, PointerEvent as ReactPointerEvent } from "react";

type DragRangeCalendarProps = {
  /** Dates sélectionnées (YYYY-MM-DD), potentiellement non consécutives */
  selectedDates: string[];
  /** Appelé à chaque changement (tableau trié de YYYY-MM-DD) */
  onChange: (dates: string[]) => void;
  /** Première date sélectionnable (défaut : aujourd'hui) */
  minDate?: string;
  /** Nombre de mois affichés à partir du mois courant (défaut 12) */
  monthsCount?: number;
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

// Petit "tic" généré via Web Audio (aucun asset), joué au clic-glissé.
let _audioCtx: AudioContext | null = null;
function playTick() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    _audioCtx ??= new Ctx();
    const ctx = _audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 1650;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  } catch {
    /* audio indisponible : on ignore */
  }
}

// Calendrier « à la Gcalendar » (mois en scroll horizontal, cases grises,
// chiffre au survol), interactif : clic pour (dé)sélectionner un jour,
// clic-glissé pour ajouter/retirer plusieurs jours (non consécutifs possibles).
export default function DragRangeCalendar({
  selectedDates,
  onChange,
  minDate,
  monthsCount = 12,
}: DragRangeCalendarProps) {
  const min = minDate || todayKey();
  const today = todayKey();

  const draggingRef = useRef(false);
  const dragModeRef = useRef<"add" | "remove">("add");
  // Set de travail mis à jour synchroniquement pendant le glissement
  const workingRef = useRef<Set<string>>(new Set(selectedDates));

  useEffect(() => {
    workingRef.current = new Set(selectedDates);
  }, [selectedDates]);

  useEffect(() => {
    const stop = () => {
      draggingRef.current = false;
    };
    document.addEventListener("pointerup", stop);
    return () => document.removeEventListener("pointerup", stop);
  }, []);

  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const months = useMemo(() => {
    const now = new Date();
    const list: { month: number; year: number }[] = [];
    for (let i = 0; i < monthsCount; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push({ month: d.getMonth(), year: d.getFullYear() });
    }
    return list;
  }, [monthsCount]);

  const applyToggle = (key: string, mode: "add" | "remove"): boolean => {
    const set = workingRef.current;
    const has = set.has(key);
    if (mode === "add" && has) return false;
    if (mode === "remove" && !has) return false;
    if (mode === "add") set.add(key);
    else set.delete(key);
    onChange(Array.from(set).sort());
    return true;
  };

  const handlePointerDown = (
    e: ReactPointerEvent,
    key: string,
    disabled: boolean,
  ) => {
    if (disabled) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    draggingRef.current = true;
    dragModeRef.current = workingRef.current.has(key) ? "remove" : "add";
    if (applyToggle(key, dragModeRef.current)) playTick();
  };

  const handlePointerEnter = (key: string, disabled: boolean) => {
    if (disabled || !draggingRef.current) return;
    if (applyToggle(key, dragModeRef.current)) playTick();
  };

  const renderMonth = (month: number, year: number): ReactElement => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7; // lundi-first
    const cells: ReactElement[] = [];

    for (let i = 0; i < firstOffset; i++) {
      cells.push(<div key={`e-${i}`} className="w-8 h-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const key = toKey(year, month, day);
      const disabled = key < min;
      const selected = selectedSet.has(key);
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
              ? "bg-gray-100 text-transparent cursor-not-allowed"
              : selected
                ? "bg-[var(--color-main)] text-white animate-plop cursor-pointer"
                : "bg-gray-200 text-transparent hover:bg-gray-300 hover:text-gray-700 cursor-pointer",
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
