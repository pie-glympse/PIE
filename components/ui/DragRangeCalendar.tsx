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
  /**
   * Restreint les jours sélectionnables à cet ensemble (YYYY-MM-DD). Utilisé
   * côté participant (voter dans les dates proposées) et côté créateur (choisir
   * la date finale parmi les dates proposées). Les mois affichés se limitent
   * alors à la fenêtre couverte par ces dates.
   */
  allowedDates?: string[];
  /**
   * Taux de présence par jour (YYYY-MM-DD → pourcentage 0..100). Colore les
   * cases (intensité verte) et affiche le pourcentage au survol. Sert au
   * créateur pour repérer les jours qui conviennent au plus grand nombre.
   */
  heatmap?: Record<string, number>;
  /** Lecture seule : affiche la heatmap sans permettre la (dé)sélection. */
  readOnly?: boolean;
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
// Deux modes optionnels : restriction à un ensemble de dates (allowedDates) et
// heatmap de présence (heatmap) affichée au survol.
export default function DragRangeCalendar({
  selectedDates,
  onChange,
  minDate,
  monthsCount = 12,
  allowedDates,
  heatmap,
  readOnly = false,
}: DragRangeCalendarProps) {
  const min = minDate || todayKey();
  const today = todayKey();

  const allowedSet = useMemo(
    () => (allowedDates ? new Set(allowedDates.map((d) => d.slice(0, 10))) : null),
    [allowedDates],
  );

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

  // Fenêtre de mois : couvre les allowedDates si fournies, sinon N mois depuis
  // le mois courant.
  const months = useMemo(() => {
    const list: { month: number; year: number }[] = [];
    if (allowedSet && allowedSet.size > 0) {
      const keys = Array.from(allowedSet).sort();
      const first = new Date(`${keys[0]}T00:00:00`);
      const last = new Date(`${keys[keys.length - 1]}T00:00:00`);
      let y = first.getFullYear();
      let m = first.getMonth();
      while (y < last.getFullYear() || (y === last.getFullYear() && m <= last.getMonth())) {
        list.push({ month: m, year: y });
        m += 1;
        if (m > 11) { m = 0; y += 1; }
      }
      return list;
    }
    const now = new Date();
    for (let i = 0; i < monthsCount; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push({ month: d.getMonth(), year: d.getFullYear() });
    }
    return list;
  }, [monthsCount, allowedSet]);

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
    if (disabled || readOnly) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    draggingRef.current = true;
    dragModeRef.current = workingRef.current.has(key) ? "remove" : "add";
    if (applyToggle(key, dragModeRef.current)) playTick();
  };

  const handlePointerEnter = (key: string, disabled: boolean) => {
    if (disabled || readOnly || !draggingRef.current) return;
    if (applyToggle(key, dragModeRef.current)) playTick();
  };

  // Vert d'intensité proportionnelle au taux de présence (heatmap).
  const heatStyle = (pct: number) => {
    const alpha = 0.15 + (Math.max(0, Math.min(100, pct)) / 100) * 0.75;
    return { backgroundColor: `rgba(22, 163, 74, ${alpha.toFixed(3)})` };
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
      const outOfRange = allowedSet ? !allowedSet.has(key) : false;
      const disabled = key < min || outOfRange;
      const selected = selectedSet.has(key);
      const isToday = key === today;
      const pct = heatmap?.[key];
      const hasHeat = typeof pct === "number";

      // En mode allowedDates, on masque totalement les jours hors plage pour ne
      // pas noyer les jours pertinents (surtout côté créateur avec la heatmap).
      if (allowedSet && outOfRange) {
        cells.push(<div key={key} className="w-8 h-8" />);
        continue;
      }

      const base =
        "w-8 h-8 rounded-md text-xs font-medium flex items-center justify-center transition-colors select-none touch-none";
      const interactive = !disabled && !readOnly;

      cells.push(
        <div key={key} className="relative group flex items-center justify-center">
          <button
            type="button"
            disabled={disabled}
            title={hasHeat ? `${Math.round(pct!)}% présents` : undefined}
            onPointerDown={(e) => handlePointerDown(e, key, disabled)}
            onPointerEnter={() => handlePointerEnter(key, disabled)}
            style={!selected && hasHeat ? heatStyle(pct!) : undefined}
            className={[
              base,
              disabled
                ? "bg-gray-100 text-transparent cursor-not-allowed"
                : selected
                  ? "bg-[var(--color-main)] text-white animate-plop"
                  : hasHeat
                    ? "text-gray-800 hover:ring-1 hover:ring-[var(--color-main)]"
                    : "bg-gray-200 text-transparent hover:bg-gray-300 hover:text-gray-700",
              interactive ? "cursor-pointer" : readOnly ? "cursor-default" : "",
              !selected && isToday && !disabled ? "ring-1 ring-[var(--color-main)]" : "",
            ].join(" ")}
          >
            {day}
          </button>
          {hasHeat && (
            <span
              className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 z-20 hidden group-hover:block whitespace-nowrap rounded bg-[var(--color-text)] px-1.5 py-0.5 text-[10px] font-poppins text-white shadow"
            >
              {Math.round(pct!)}% présents
            </span>
          )}
        </div>,
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
