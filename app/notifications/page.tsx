"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import Image from "next/image";
import BackArrow from "@/components/ui/BackArrow";
import FeedbackModal from "@/components/FeedbackModal";
import InvitationModal from "@/components/InvitationModal";
import MainButton from "@/components/ui/MainButton";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
  eventId?: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<{
    eventId: string;
    eventTitle: string;
    notificationId: string;
  } | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<{
    eventId: string;
    eventTitle: string;
    creatorName: string;
    notificationId: string;
  } | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const refetch = () => setRefetchKey((k) => k + 1);

  // Récupérer les notifications depuis l'API
  useEffect(() => {
    if (isLoading || !user) return;

    const controller = new AbortController();

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${user.id}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          console.warn(`Notifications: ${response.status}`, body);
          return;
        }

        const data: Notification[] = await response.json();

        // Marquer comme lues automatiquement à la visite (sauf invitations en attente,
        // qui restent actionnables via Accepter / Décliner)
        const hasUnread = data.some((n) => !n.read && n.type !== "EVENT_INVITATION");
        const displayData = data.map((n) =>
          n.type !== "EVENT_INVITATION" ? { ...n, read: true } : n
        );
        setNotifications(displayData);

        if (hasUnread) {
          fetch(`/api/notifications`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
            signal: controller.signal,
          })
            .then(() => window.dispatchEvent(new Event("notificationsUpdated")))
            .catch(() => {});
        }

        // Ouvrir automatiquement la première invitation non lue
        const unreadInvitation = data.find(
          (n) => !n.read && n.type === "EVENT_INVITATION" && n.eventId
        );

        if (unreadInvitation) {
          const messageMatch = unreadInvitation.message.match(/@([^@]+?) vous a invité/);
          const creatorName = messageMatch ? messageMatch[1].trim() : "Quelqu'un";

          try {
            const eventRes = await fetch(`/api/events/${unreadInvitation.eventId}`, {
              signal: controller.signal,
            });
            const eventData = eventRes.ok ? await eventRes.json() : {};
            const event = eventData.event || eventData;

            setSelectedInvitation({
              eventId: unreadInvitation.eventId!,
              eventTitle: event.title || "Événement",
              creatorName,
              notificationId: unreadInvitation.id,
            });
          } catch {
            setSelectedInvitation({
              eventId: unreadInvitation.eventId!,
              eventTitle: "Événement",
              creatorName,
              notificationId: unreadInvitation.id,
            });
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.warn("Erreur lors du chargement des notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    return () => controller.abort();
  }, [isLoading, user, refetchKey]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
        // Déclencher un événement pour notifier le Header
        window.dispatchEvent(new Event("notificationsUpdated"));
      }
    } catch (error) {
      console.error("Erreur mise à jour notification:", error);
    }
  };

  const handleFeedbackClick = async (notification: Notification) => {
    if (!notification.eventId) return;

    try {
      // Récupérer les détails de l'événement
      const eventResponse = await fetch(`/api/events/${notification.eventId}`);
      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        setSelectedFeedback({
          eventId: notification.eventId!,
          eventTitle: eventData.event?.title || eventData.title || "Événement",
          notificationId: notification.id,
        });
      } else {
        // Si on ne peut pas récupérer l'événement, utiliser quand même la notification
        setSelectedFeedback({
          eventId: notification.eventId,
          eventTitle: "Événement",
          notificationId: notification.id,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'événement:", error);
      setSelectedFeedback({
        eventId: notification.eventId,
        eventTitle: "Événement",
        notificationId: notification.id,
      });
    }
  };


  const handleInlineResponse = async (notification: Notification, action: "accept" | "decline") => {
    if (!notification.eventId || !user) return;
    try {
      await fetch(`/api/events/${notification.eventId}/invitation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, action }),
      });
      await handleMarkAsRead(notification.id);
      refetch();
    } catch (error) {
      console.error("Erreur réponse invitation:", error);
    }
  };

  const formatMessage = (message: string): React.ReactNode => {
    const match = message.match(/^@([A-Za-zÀ-ÿ]+(?:\s[A-Za-zÀ-ÿ]+)?)(\s[\s\S]*)?$/);
    if (!match) return message;
    return (
      <>
        <strong>{match[1]}</strong>{match[2] ?? ""}
      </>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Il y a 1 jour";
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    return date.toLocaleDateString("fr-FR");
  };

  // Séparer les notifications par date
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const newNotifications = notifications.filter((n) => !n.read);
  const recentReadNotifications = notifications.filter((n) => {
    const notifDate = new Date(n.createdAt);
    return n.read && notifDate >= oneDayAgo;
  });
  const oldNotifications = notifications.filter((n) => {
    const notifDate = new Date(n.createdAt);
    return n.read && notifDate < oneDayAgo;
  });


  const totalNotifications = notifications.length;

  if (isLoading || loading) {
    return <div className="pt-24 p-10">Chargement...</div>;
  }

  return (
    <main className="h-screen overflow-y-auto pt-24 p-10 flex flex-col gap-6">
      <div className="h-full w-full flex flex-col gap-4 items-start p-10">
        {/* Back Arrow */}
        <BackArrow onClick={() => router.back()} className="!mb-0" />

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Vos notifications ({totalNotifications})
        </h1>

        {/* Section Nouveau */}
        {newNotifications.length > 0 && (
          <section className="mb-6 w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Nouveau
            </h2>
            <div className="space-y-2">
              {newNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center gap-3">
                  <div
                    className={`flex flex-col gap-2 p-3 bg-[#F4F4F4] rounded-lg flex-1 ${
                      notification.type === "FEEDBACK_REQUEST"
                        ? "cursor-pointer hover:bg-gray-200 transition"
                        : ""
                    }`}
                    onClick={() => {
                      if (notification.type === "FEEDBACK_REQUEST") {
                        handleFeedbackClick(notification);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-gray-800 flex-1">
                        {formatMessage(notification.message)}
                      </p>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    {notification.type === "EVENT_INVITATION" && (
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleInlineResponse(notification, "accept"); }}
                          className="px-4 py-1.5 bg-[var(--color-text)] text-white text-sm font-poppins rounded-lg hover:opacity-80 transition cursor-pointer"
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleInlineResponse(notification, "decline"); }}
                          className="px-4 py-1.5 border border-[var(--color-text)] text-[var(--color-text)] text-sm font-poppins rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        >
                          Décliner
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="flex-shrink-0 cursor-pointer hover:opacity-70 transition"
                    aria-label="Marquer comme lu"
                  >
                    <Image
                      src="/icons/star-notification.svg"
                      alt="Non lu"
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section Récentes (lues < 24h) */}
        {recentReadNotifications.length > 0 && (
          <section className="mb-6 w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Récentes
            </h2>
            <div className="space-y-2">
              {recentReadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg"
                >
                  <p className="text-gray-800 flex-1">{notification.message}</p>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section La semaine dernière */}
        {oldNotifications.length > 0 && (
          <section className="w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              La semaine dernière
            </h2>
            <div className="space-y-2">
              {oldNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between gap-4 p-3 bg-white rounded-lg"
                >
                  <p className="text-gray-800 flex-1">{notification.message}</p>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* État vide */}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center w-full min-h-96 pb-16">
            <div className="text-center space-y-3">
              <Image
                src="/images/mascotte/hasard.png"
                alt="Mascotte triste"
                width={1000}
                height={1000}
                className="mx-auto object-contain w-48 h-48"
                sizes="(max-width: 640px) 150px, 192px"
                quality={85}
                loading="lazy"
              />
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-gray-800 font-urbanist">
                  Aucune notification trouvée
                </h3>
                <p className="text-gray-500 text-lg max-w-md mx-auto font-poppins">
                  Il semble qu’il n’y ait aucune notification pour le moment. Ne vous inquiétez pas, ça ne va pas tarder !
                </p>
              </div>
              <div className="pt-4">
                <MainButton
                  onClick={() => router.push("/")}
                  text="Retourner à l'accueil"
                  color="bg-[var(--color-main)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de feedback */}
      {selectedFeedback && user && (
        <FeedbackModal
          isOpen={true}
          onClose={() => {
            setSelectedFeedback(null);
            refetch();
          }}
          eventId={selectedFeedback.eventId}
          eventTitle={selectedFeedback.eventTitle}
          userId={user.id}
          notificationId={selectedFeedback.notificationId}
        />
      )}

      {/* Modal d'invitation */}
      {selectedInvitation && user && (
        <InvitationModal
          isOpen={true}
          onClose={() => {
            setSelectedInvitation(null);
            refetch();
          }}
          eventId={selectedInvitation.eventId}
          eventTitle={selectedInvitation.eventTitle}
          creatorName={selectedInvitation.creatorName}
          userId={user.id}
          notificationId={selectedInvitation.notificationId}
          onResponse={(accepted) => {
            if (accepted) {
            }
          }}
        />
      )}
    </main>
  );
}
