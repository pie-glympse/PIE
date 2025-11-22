import { useState, useEffect } from "react";

export type EventType = {
  id: string;
  uuid: string;
  title: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxPersons?: string;
  costPerPerson?: string;
  state?: string;
  activityType?: string;
  city?: string;
  maxDistance?: number;
  tags: { id: string; name: string }[];
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

export const useEvents = (userId?: string) => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/events?userId=${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des événements");
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  return { events, loading, error, setEvents };
};

export const filterEventsByStatus = (
  events: EventType[],
  statusFilter: "all" | "past" | "upcoming" | "preparation"
): EventType[] => {
  const now = new Date();
  return events.filter((event) => {
    if (statusFilter === "all") return true;

    const eventDate = new Date(event.startDate || "");

    if (statusFilter === "past") {
      return eventDate < now;
    }
    if (statusFilter === "upcoming") {
      return eventDate > now && event.state !== "pending";
    }
    if (statusFilter === "preparation") {
      return event.state === "pending";
    }

    return true;
  });
};
