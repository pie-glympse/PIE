"use client";

import { useEffect, useState } from "react";
import {
    addMinutesToTime,
    COMMON_START_TIMES,
    DURATION_PRESETS,
    formatTimeLabel,
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

type TimeRangePickerProps = {
  startTime: string;
  endTime: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
  startError?: string;
  endError?: string;
};

export function TimeRangePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  startError,
  endError,
}: TimeRangePickerProps) {
  const [durationMinutes, setDurationMinutes] = useState<number | null>(120);
  const [customEnd, setCustomEnd] = useState(false);

  useEffect(() => {
    if (!startTime || !endTime || customEnd) return;
    const preset = DURATION_PRESETS.find(
      (p) => addMinutesToTime(startTime, p.minutes) === endTime,
    );
    setDurationMinutes(preset?.minutes ?? null);
  }, [startTime, endTime, customEnd]);

  const applyDuration = (minutes: number) => {
    if (!startTime) return;
    setCustomEnd(false);
    setDurationMinutes(minutes);
    onEndChange(addMinutesToTime(startTime, minutes));
  };

  const pickStart = (time: string) => {
    onStartChange(time);
    if (!customEnd && durationMinutes) {
      onEndChange(addMinutesToTime(time, durationMinutes));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className={formLabelClass}>Heure de début *</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_START_TIMES.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => pickStart(time)}
              className={`${chipBaseClass} ${
                startTime === time ? chipSelectedClass : chipDefaultClass
              }`}
            >
              {formatTimeLabel(time)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-body-small font-poppins text-[var(--color-grey-three)]">
            Autre
          </span>
          <input
            type="time"
            step={1800}
            value={startTime}
            onChange={(e) => pickStart(e.target.value)}
            className={`${formInputClass} max-w-[160px]`}
          />
        </div>
        {startError ? <p className={formErrorClass}>{startError}</p> : null}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className={formLabelClass}>Durée</p>
          <button
            type="button"
            onClick={() => setCustomEnd((v) => !v)}
            className="text-body-small font-poppins text-[var(--color-grey-three)] hover:text-[var(--color-text)] underline"
          >
            {customEnd ? "Utiliser une durée" : "Heure de fin précise"}
          </button>
        </div>

        {!customEnd ? (
          <>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  disabled={!startTime}
                  onClick={() => applyDuration(preset.minutes)}
                  className={`${chipBaseClass} ${
                    durationMinutes === preset.minutes
                      ? chipSelectedClass
                      : chipDefaultClass
                  } ${!startTime ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {startTime && endTime ? (
              <p className={formHintClass}>
                Fin estimée : {formatTimeLabel(endTime)}
              </p>
            ) : null}
          </>
        ) : (
          <input
            type="time"
            step={1800}
            value={endTime}
            onChange={(e) => {
              setCustomEnd(true);
              onEndChange(e.target.value);
            }}
            className={`${formInputClass} max-w-[160px]`}
          />
        )}
        {endError ? <p className={formErrorClass}>{endError}</p> : null}
      </div>
    </div>
  );
}
