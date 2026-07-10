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
  city?: string;
  maxDistance?: number;
  isSpecificPlace?: boolean;
  createdById?: string;
  selectedGoogleTags?: {
    id: string;
    techName: string;
    displayName?: string | null;
  }[];
  selectedGoogleTagGroups?: {
    id: string;
    name: string;
    subGroups?: { id: string; name: string }[];
  }[];
  confirmedGoogleTag?: {
    id: string;
    techName: string;
    displayName?: string | null;
  } | null;
  confirmedGoogleTagSubGroup?: {
    id: string;
    name: string;
  } | null;
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
  };
  isPublic?: boolean;
  publicStatus?: string;
  description?: string;
  documentCount?: number;
  participantCount?: number;
  maxParticipants?: number | null;
  isParticipant?: boolean;
  isCreator?: boolean;
  canJoin?: boolean;
  isFull?: boolean;
  createdAt?: string;
};

export const useEvents = (userId?: string) => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = () => {
    if (!userId) {
      setLoading(false);
      return Promise.resolve();
    }

    setLoading(true);
    return fetch(
      `/api/events?userId=${encodeURIComponent(userId)}&_ts=${Date.now()}`,
      {
        cache: "no-store",
      },
    )
      .then((res) => {
        if (!res.ok)
          throw new Error("Erreur lors de la récupération des événements");
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [userId]);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ eventId?: string; event?: EventType }>)
        .detail;
      if (detail?.event?.id) {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === detail.event!.id
              ? {
                  ...ev,
                  ...detail.event,
                  users: detail.event!.users ?? ev.users,
                  participantCount:
                    detail.event!.participantCount ??
                    detail.event!.users?.length ??
                    ev.participantCount,
                }
              : ev,
          ),
        );
      }
      void fetchEvents();
    };
    window.addEventListener("eventsUpdated", onUpdate);
    return () => window.removeEventListener("eventsUpdated", onUpdate);
  }, [userId]);

  return { events, loading, error, setEvents, refetch: fetchEvents };
};

export const filterEventsByStatus = (
  events: EventType[],
  statusFilter: "all" | "past" | "upcoming" | "preparation",
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
