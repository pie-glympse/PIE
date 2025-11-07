import { useState, useEffect } from 'react';

export const useEventPreferences = (userId?: string) => {
  const [userEventPreferences, setUserEventPreferences] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const fetchUserPreferences = async () => {
      try {
        const response = await fetch(`/api/user-event-preferences?userId=${userId}`);
        if (response.ok) {
          const preferences = await response.json();
          type UserEventPreference = { event: { id: string } };
          const eventIdsWithPreferences = new Set<string>(
            preferences.map((pref: UserEventPreference) => String(pref.event.id))
          );
          setUserEventPreferences(eventIdsWithPreferences);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      }
    };

    fetchUserPreferences();
  }, [userId]);

  return { userEventPreferences };
};

