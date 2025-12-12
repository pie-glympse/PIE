import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

interface InvitationNotification {
  id: string;
  eventId: string;
  eventTitle: string;
  creatorName: string;
}

export function useInvitationNotification() {
  const { user, isLoading } = useUser();
  const [pendingInvitation, setPendingInvitation] =
    useState<InvitationNotification | null>(null);

  useEffect(() => {
    const checkForInvitations = async () => {
      if (isLoading || !user) {
        return;
      }

      try {
        const response = await fetch(`/api/notifications?userId=${user.id}`);
        if (response.ok) {
          const notifications = await response.json();
          
          // Trouver la première invitation non lue
          const unreadInvitation = notifications.find(
            (n: any) =>
              !n.read &&
              n.type === "EVENT_INVITATION" &&
              n.eventId
          );

          if (unreadInvitation) {
            // Récupérer les détails de l'événement
            try {
              const eventResponse = await fetch(
                `/api/events/${unreadInvitation.eventId}`
              );
              if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                const event = eventData.event || eventData;

                // Extraire le nom du créateur depuis le message
                // Format: "@FirstName LastName vous a invité à son événement "Title""
                const messageMatch = unreadInvitation.message.match(
                  /@([^@]+?) vous a invité/
                );
                const creatorName = messageMatch
                  ? messageMatch[1].trim()
                  : "Quelqu'un";

                setPendingInvitation({
                  id: unreadInvitation.id,
                  eventId: unreadInvitation.eventId,
                  eventTitle: event.title || "Événement",
                  creatorName,
                });
              } else {
                // Si on ne peut pas récupérer l'événement, utiliser quand même la notification
                const messageMatch = unreadInvitation.message.match(
                  /@([^@]+?) vous a invité/
                );
                setPendingInvitation({
                  id: unreadInvitation.id,
                  eventId: unreadInvitation.eventId,
                  eventTitle: "Événement",
                  creatorName: messageMatch ? messageMatch[1].trim() : "Quelqu'un",
                });
              }
            } catch (error) {
              console.error(
                "Erreur lors de la récupération de l'événement:",
                error
              );
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des invitations:", error);
      }
    };

    checkForInvitations();

    // Écouter les mises à jour de notifications
    const handleUpdate = () => {
      checkForInvitations();
    };

    window.addEventListener("notificationsUpdated", handleUpdate);

    return () => {
      window.removeEventListener("notificationsUpdated", handleUpdate);
    };
  }, [user, isLoading]);

  const clearPendingInvitation = () => {
    setPendingInvitation(null);
  };

  return {
    pendingInvitation,
    clearPendingInvitation,
  };
}

