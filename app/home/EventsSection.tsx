"use client";

import { useState, useEffect } from "react";

export type EventType = {
  id: string;
  uuid: string;
  title: string;
  description?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxPersons?: string;
  costPerPerson?: string;
  city?: string;
  maxDistance?: string;
  activityType?: string;
  recurring?: boolean;
  duration?: string;
  recurringRate?: string;
  state?: string;
  createdById?: string;
  tags: { id: string; name: string }[];
  users?: { id: string; firstName: string; lastName: string; email: string }[];
  createdBy?: { id: string; firstName: string; lastName: string; email: string };
};

function fetchEvents(userId: string): Promise<{ events: EventType[]; error: string | null }> {
  const uid = typeof userId === "bigint" ? String(userId) : String(userId ?? "");
  return fetch(`/api/events?userId=${encodeURIComponent(uid)}`)
    .then((res) => {
      if (!res.ok) throw new Error("Erreur lors de la récupération des événements");
      return res.json();
    })
    .then((data: unknown) => {
      const events = Array.isArray(data) ? data : [];
      return { events: events as EventType[], error: null };
    })
    .catch((err) => ({
      events: [],
      error: err instanceof Error ? err.message : "Erreur lors de la récupération",
    }));
}

interface EventsSectionProps {
  userId: string;
  refreshKey: number;
  fallback: React.ReactNode;
  children: (result: { events: EventType[]; error: string | null }) => React.ReactNode;
}

export function EventsSection({ userId, refreshKey, fallback, children }: EventsSectionProps) {
  const stableUserId = typeof userId === "bigint" ? String(userId) : userId;
  const [result, setResult] = useState<{
    events: EventType[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    fetchEvents(stableUserId).then((data) => {
      if (!cancelled) setResult(data);
    });
    return () => {
      cancelled = true;
    };
  }, [stableUserId, refreshKey]);

  if (result === null) {
    return <>{fallback}</>;
  }
  return <>{children(result)}</>;
}
