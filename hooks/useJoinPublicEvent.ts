import { useState, useCallback } from "react";

export function useJoinPublicEvent(onSuccess?: () => void) {
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);

  const joinEvent = useCallback(
    async (eventId: string, userId: string) => {
      setJoiningEventId(eventId);
      try {
        const res = await fetch(`/api/events/${eventId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.error || "Impossible de rejoindre l'événement");
          return false;
        }
        window.dispatchEvent(
          new CustomEvent("eventsUpdated", { detail: { eventId, event: data } }),
        );
        onSuccess?.();
        return data;
      } catch {
        alert("Erreur réseau");
        return false;
      } finally {
        setJoiningEventId(null);
      }
    },
    [onSuccess],
  );

  return { joinEvent, joiningEventId };
}
