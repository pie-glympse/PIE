"use client";
import { useEffect, useRef, useState } from "react";

const STRIPE_COLORS = ["#FF5B5B", "#FCC638", "#F78AFF"];
const DURATION = 4000;

interface ToastProps {
  title: string;
  body: string;
  subtitle?: string;
  onDismiss: () => void;
}

export default function Toast({ title, body, subtitle, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(DURATION);
  const startedAtRef = useRef<number>(0);

  const startExitTimer = (delay: number) => {
    startedAtRef.current = Date.now();
    exitTimerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, delay);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    startExitTimer(DURATION);
    return () => {
      cancelAnimationFrame(frame);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseEnter = () => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    remainingRef.current -= Date.now() - startedAtRef.current;
    setPaused(true);
  };

  const handleMouseLeave = () => {
    setPaused(false);
    startExitTimer(remainingRef.current);
  };

  const handleClick = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex overflow-hidden rounded-l bg-white shadow-xl cursor-pointer w-72 transition-all duration-300 ${
        visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } ${paused ? "ring-2 ring-[var(--color-main)]" : ""}`}
    >
      {/* Liseré coloré */}
      <div className="w-2 flex flex-col flex-shrink-0">
        {STRIPE_COLORS.map((color) => (
          <div key={color} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>

      {/* Contenu */}
      <div className="px-4 py-3 flex flex-col gap-0.5">
        <span className="text-xs text-gray-400 font-poppins">{title}</span>
        <span className="text-2xl font-bold font-urbanist text-[var(--color-text)]">
          {body}
        </span>
        {subtitle && (
          <span className="text-xs text-gray-500 font-poppins">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
