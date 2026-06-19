import { useState, useEffect, useCallback } from "react";

export const useEventPreferences = (userId?: string) => {
  const [userEventPreferences, setUserEventPreferences] = useState<Set<string>>(
    new Set(),
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshPreferences = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchUserPreferences = async () => {
      try {
        const response = await fetch(
          `/api/user-event-preferences?userId=${userId}`,
        );
        if (response.ok) {
          const preferences = await response.json();
          type UserEventPreference = { event: { id: string } };
          const eventIdsWithPreferences = new Set<string>(
            preferences.map((pref: UserEventPreference) =>
              String(pref.event.id),
            ),
          );
          setUserEventPreferences(eventIdsWithPreferences);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des préférences:", error);
      }
    };

    fetchUserPreferences();
  }, [userId, refreshKey]);

  useEffect(() => {
    const onUpdate = () => refreshPreferences();
    window.addEventListener("eventsUpdated", onUpdate);
    window.addEventListener("preferencesUpdated", onUpdate);
    return () => {
      window.removeEventListener("eventsUpdated", onUpdate);
      window.removeEventListener("preferencesUpdated", onUpdate);
    };
  }, [refreshPreferences]);

  return { userEventPreferences, refreshPreferences };
};
