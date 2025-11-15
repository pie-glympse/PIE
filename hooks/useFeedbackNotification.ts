import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

interface FeedbackNotification {
  id: string;
  eventId: string;
  message: string;
  eventTitle?: string;
}

export function useFeedbackNotification() {
  const { user, isLoading } = useUser();
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackNotification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) {
      setLoading(false);
      return;
    }

    const fetchPendingFeedback = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${user.id}`);
        if (response.ok) {
          const notifications = await response.json();

          // Trouver la première notification de feedback non lue
          const feedbackNotification = notifications.find((n: any) => n.type === "FEEDBACK_REQUEST" && !n.read);

          if (feedbackNotification) {
            // Récupérer les détails de l'événement pour avoir le titre
            try {
              const eventResponse = await fetch(`/api/events/${feedbackNotification.eventId}`);
              if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                setPendingFeedback({
                  id: feedbackNotification.id,
                  eventId: feedbackNotification.eventId,
                  message: feedbackNotification.message,
                  eventTitle: eventData.event?.title || eventData.title || "Événement",
                });
              } else {
                // Si on ne peut pas récupérer l'événement, utiliser quand même la notification
                setPendingFeedback({
                  id: feedbackNotification.id,
                  eventId: feedbackNotification.eventId,
                  message: feedbackNotification.message,
                  eventTitle: "Événement",
                });
              }
            } catch (error) {
              console.error("Erreur lors de la récupération de l'événement:", error);
              setPendingFeedback({
                id: feedbackNotification.id,
                eventId: feedbackNotification.eventId,
                message: feedbackNotification.message,
                eventTitle: "Événement",
              });
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingFeedback();

    // Écouter les mises à jour de notifications
    const handleUpdate = () => {
      fetchPendingFeedback();
    };

    window.addEventListener("notificationsUpdated", handleUpdate);

    return () => {
      window.removeEventListener("notificationsUpdated", handleUpdate);
    };
  }, [user, isLoading]);

  const clearPendingFeedback = () => {
    setPendingFeedback(null);
  };

  return { pendingFeedback, loading, clearPendingFeedback };
}
