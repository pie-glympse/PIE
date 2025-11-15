"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../context/UserContext";
import Image from "next/image";
import BackArrow from "@/components/ui/BackArrow";
import FeedbackModal from "@/components/FeedbackModal";

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

  // Récupérer les notifications depuis l'API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isLoading && user) {
        try {
          const response = await fetch(`/api/notifications?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            console.log('[Notifications] Data received:', data);
            setNotifications(data);
          } else {
            console.error("Erreur récupération notifications");
          }
        } catch (error) {
          console.error("Erreur:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchNotifications();
  }, [isLoading, user]);

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
        window.dispatchEvent(new Event('notificationsUpdated'));
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

  console.log('[Notifications] Total:', notifications.length);
  console.log('[Notifications] New:', newNotifications.length);
  console.log('[Notifications] Recent read:', recentReadNotifications.length);
  console.log('[Notifications] Old:', oldNotifications.length);

  const totalNotifications = notifications.length;

  if (isLoading || loading) {
    return <div className="pt-24 p-6">Chargement...</div>;
  }

  return (
    <main className="h-screen overflow-y-auto pt-24 p-6 flex flex-col gap-6">
      <div className="h-full w-full flex flex-col gap-4 items-start p-4 md:p-10">
        {/* Back Arrow */}
        <BackArrow onClick={() => router.back()} className="!mb-0" />

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Vos notifications ({totalNotifications})
        </h1>

        {/* Section Nouveau */}
        {newNotifications.length > 0 && (
          <section className="mb-6 w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Nouveau</h2>
            <div className="space-y-2">
              {newNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex items-center justify-between gap-4 p-3 bg-[#F4F4F4] rounded-lg flex-1 ${
                      notification.type === "FEEDBACK_REQUEST" ? "cursor-pointer hover:bg-gray-200 transition" : ""
                    }`}
                    onClick={() => {
                      if (notification.type === "FEEDBACK_REQUEST") {
                        handleFeedbackClick(notification);
                      }
                    }}
                  >
                    <p className="text-gray-800 flex-1">{notification.message}</p>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(notification.createdAt)}
                    </span>
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
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Récentes</h2>
            <div className="space-y-2">
              {recentReadNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between gap-4 p-3 bg-[#F4F4F4] rounded-lg opacity-70"
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
                  className="flex items-center justify-between gap-4 p-3 bg-[#F4F4F4] rounded-lg opacity-70"
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
          <div className="text-center py-12">
            <Image
              src="/images/icones/notification.svg"
              alt="Aucune notification"
              width={64}
              height={64}
              className="mx-auto mb-4 opacity-50"
            />
            <p className="text-gray-500 text-lg">Aucune notification</p>
          </div>
        )}
      </div>

      {/* Modal de feedback */}
      {selectedFeedback && user && (
        <FeedbackModal
          isOpen={true}
          onClose={() => {
            setSelectedFeedback(null);
            // Recharger les notifications pour mettre à jour l'état
            const fetchNotifications = async () => {
              try {
                const response = await fetch(`/api/notifications?userId=${user.id}`);
                if (response.ok) {
                  const data = await response.json();
                  setNotifications(data);
                }
              } catch (error) {
                console.error("Erreur:", error);
              }
            };
            fetchNotifications();
          }}
          eventId={selectedFeedback.eventId}
          eventTitle={selectedFeedback.eventTitle}
          userId={user.id}
          notificationId={selectedFeedback.notificationId}
        />
      )}
    </main>
  );
}
