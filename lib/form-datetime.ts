export function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export function getNextWeekday(from: Date, weekday: number): Date {
  const date = new Date(from);
  const diff = (weekday + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(wrapped / 60);
  const nm = wrapped % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h}h${m === 0 ? "" : String(m).padStart(2, "0")}`;
}

export function formatDateLabel(isoDate: string): string {
  if (!isoDate) return "";
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export const COMMON_START_TIMES = [
  "09:00",
  "10:00",
  "12:00",
  "14:00",
  "18:00",
  "19:30",
] as const;

export const DURATION_PRESETS = [
  { label: "1 h", minutes: 60 },
  { label: "2 h", minutes: 120 },
  { label: "3 h", minutes: 180 },
  { label: "4 h", minutes: 240 },
  { label: "Journée", minutes: 480 },
] as const;

export function buildQuickDateOptions(from = new Date()) {
  const today = toDateInputValue(from);
  const tomorrow = toDateInputValue(addDays(from, 1));
  const nextFriday = toDateInputValue(getNextWeekday(from, 5));
  return [
    { id: "today", label: "Aujourd'hui", value: today },
    { id: "tomorrow", label: "Demain", value: tomorrow },
    { id: "friday", label: "Vendredi", value: nextFriday },
  ] as const;
}
