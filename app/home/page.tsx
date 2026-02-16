"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import GCalendar from "@/components/Gcalendar";
import Gcard from "@/components/Gcard";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type EventType = {
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
  users?: {
    // Ajouter users pour les participants
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
};

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<EventType[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dropdownEvent, setDropdownEvent] = useState<string | null>(null);
  const [leaveModal, setLeaveModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
  } | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleFillPreferences = (event: EventType) => {
    // ✅ Utiliser le nouveau système si l'événement a des questions configurées
    // Sinon, utiliser l'ancien système
    if (event.activityType) {
      const { getQuestionsForActivityType } = require('@/lib/preferences/questionsConfig');
      const questions = getQuestionsForActivityType(event.activityType);
      if (questions.length > 0) {
        router.push(`/event-preferences/${event.id}?eventTitle=${encodeURIComponent(event.title)}`);
        return;
      }
    }
    // Fallback sur l'ancien système
    router.push(`/answer-event/${event.id}?eventTitle=${encodeURIComponent(event.title)}`);
  };

  // Fonction pour récupérer les événements
  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/events?userId=${user.id}`);
      if (!res.ok) throw new Error("Erreur lors de la récupération des événements");
      const data = await res.json();
      setEvents(data);
      setFetchError(null);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Erreur lors de la récupération");
    }
  };

  // Récupérer les événements depuis l'API
  useEffect(() => {
    if (!isLoading && user) {
      fetchEvents();
    }
  }, [isLoading, user]);

  // Écouter les mises à jour d'événements (après acceptation d'invitation, etc.)
  useEffect(() => {
    const handleEventsUpdate = () => {
      if (user) {
        fetchEvents();
      }
    };

    // Écouter l'événement de mise à jour des notifications (déclenché après acceptation d'invitation)
    window.addEventListener("notificationsUpdated", handleEventsUpdate);
    // Écouter aussi un événement spécifique pour les mises à jour d'événements
    window.addEventListener("eventsUpdated", handleEventsUpdate);

    return () => {
      window.removeEventListener("notificationsUpdated", handleEventsUpdate);
      window.removeEventListener("eventsUpdated", handleEventsUpdate);
    };
  }, [user]);

  const adaptEventForGcard = (event: EventType) => {
    // Assigner différentes images de fond selon les tags
    const getBackgroundUrl = (tags: { id: string; name: string }[]) => {
      if (tags.some((tag) => tag.name === "Restauration")) return "/images/illustration/palm.svg";
      if (tags.some((tag) => tag.name === "Afterwork")) return "/images/illustration/stack.svg";
      if (tags.some((tag) => tag.name === "Team Building")) return "/images/illustration/roundstar.svg";
      return "/images/illustration/roundstar.svg"; // Par défaut
    };

    return {
      title: event.title,
      date: event.date || new Date().toISOString(),
      participants: event.users || [], // Utiliser les vrais participants ou un tableau vide
      backgroundUrl: getBackgroundUrl(event.tags),
      state: event.state, // ✅ Ajouter l'état de l'événement
    };
  };

  const openDeleteModal = (eventId: string, eventTitle: string) => {
    setDeleteError(null);
    setDeleteModal({
      isOpen: true,
      eventId,
      eventTitle,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
    setDeleteError(null);
  };

  const handleDeleteEvent = async () => {
    if (!deleteModal || !user) return;

    try {
      const res = await fetch(`/api/events/${deleteModal.eventId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        // Mise à jour locale en supprimant l'event supprimé
        setEvents((prev) => prev.filter((event) => event.id !== deleteModal.eventId));
        closeDeleteModal();
      } else {
        const errorData = await res.json();
        setDeleteError(errorData.error || "Erreur lors de la suppression de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors de la suppression :", error);
      setDeleteError("Erreur réseau lors de la suppression.");
    }
  };

  const openLeaveModal = (event: EventType) => {
    setLeaveError(null);
    setLeaveModal({
      isOpen: true,
      eventId: event.id,
      eventTitle: event.title,
    });
  };

  const closeLeaveModal = () => {
    setLeaveModal(null);
    setLeaveError(null);
  };

  const handleLeaveEvent = async () => {
    if (!leaveModal || !user) return;

    try {
      const response = await fetch(`/api/events/${leaveModal.eventId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setEvents((prev) => prev.filter((event) => event.id !== leaveModal.eventId));
        closeLeaveModal();
      } else {
        const errorData = await response.json();
        setLeaveError(errorData.error || "Erreur lors du départ de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors du départ de l'événement :", error);
      setLeaveError("Erreur réseau lors du départ de l'événement.");
    }
  };

  const handleShare = (eventId: string, eventTitle: string) => {
    // Logique de partage - vous pouvez adapter selon vos besoins
    alert(`Partager l'événement: ${eventTitle}`);
  };

  // Fonction pour modifier un événement
  const handleEditEvent = (eventId: string) => {
    router.push(`/edit-event/${eventId}`);
  };

  // Fonction pour copier un événement
  const handleCopyEvent = (event: EventType) => {
    // Fonctions utilitaires pour formater les dates et heures
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0]; // Format YYYY-MM-DD
    };

    const formatTime = (timeString: string | undefined) => {
      if (!timeString) return "";
      const time = new Date(timeString);
      return time.toTimeString().split(" ")[0].substring(0, 5); // Format HH:MM
    };

    // Créer les paramètres URL pour pré-remplir le formulaire avec TOUS les champs
    const params = new URLSearchParams();

    params.set("copy", "true");
    if (event.title) params.set("title", `${event.title}`);
    if (event.startDate) params.set("startDate", formatDate(event.startDate));
    if (event.endDate) params.set("endDate", formatDate(event.endDate));
    if (event.startTime) params.set("startTime", formatTime(event.startTime));
    if (event.endTime) params.set("endTime", formatTime(event.endTime));
    if (event.maxPersons) params.set("maxPersons", event.maxPersons);
    if (event.costPerPerson) params.set("costPerPerson", event.costPerPerson);
    if (event.city) params.set("city", event.city);
    if (event.maxDistance) params.set("maxDistance", event.maxDistance);
    if (event.activityType) params.set("activityType", event.activityType);
    if (event.recurring !== undefined) params.set("recurring", event.recurring.toString());
    if (event.duration) params.set("duration", event.duration);
    if (event.recurringRate) params.set("recurringRate", event.recurringRate);

    // Rediriger vers la page de création avec les paramètres
    router.push(`/create-event?${params.toString()}`);
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  const isAuthorized = user ? ["ADMIN", "SUPER_ADMIN"].includes(user.role) : false;

  return (
    <>
      <main className="overflow-y-auto md:overflow-hidden pt-24 p-10 flex flex-col gap-8">
        {/* Section Bienvenue */}
        <section className="mt-10">
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Bienvenue,</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-semibold text-gray-800">
              {user ? (
                <>
                  <span className="capitalize">{user.lastName}</span>{" "}
                  <span className="capitalize">{user.firstName}</span>
                </>
              ) : (
                "invité"
              )}
            </p>
            <Image
              src="/images/icones/pastille.svg"
              alt="Statut utilisateur"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </div>
        </section>

        {/* Calendrier */}
        <section>
          <GCalendar year={2025} />
          {/* Légende des couleurs */}
          <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded  bg-[var(--color-secondary)]"></div>
              <span className="text-sm text-gray-500">Gastronomie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--color-calendar-green)]"></div>
              <span className="text-sm text-gray-500">Nature & Bien-être</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--color-tertiary)]"></div>
              <span className="text-sm text-gray-500">Divertissement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[var(--color-main)]"></div>
              <span className="text-sm text-gray-500">Culture</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500"></div>
              <span className="text-sm text-gray-500">Sport</span>
            </div>
          </div>
        </section>

        {/* Évènements à venir */}
        <section className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {events.length > 0 ? "Évènements à venir" : "Pas d'évènement à venir"}
          </h2>

          {fetchError && <p className="text-red-600 font-semibold mb-4">{fetchError}</p>}

          {/* Container responsive pour les cartes */}
          <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-2">
            {events.length === 0 && !fetchError && <p className="text-gray-500">Aucun événement trouvé.</p>}

            {events.slice(0, 3).map((event) => {
              // Comparer les IDs en tant que strings pour éviter les problèmes de type
              const isCreator = !!(user && event.createdBy?.id && String(event.createdBy.id) === String(user.id));
              const isParticipant = event.users?.some((u) => String(u.id) === String(user?.id)) || false;
              const canLeave = !isCreator && isParticipant;

              return (
                <Gcard
                  eventId={event.id}
                  key={event.id}
                  {...adaptEventForGcard(event)}
                  className="w-full md:w-100 h-60 md:flex-shrink-0"
                  dropdownOpen={dropdownEvent === event.id}
                  onDropdownToggle={() => setDropdownEvent(dropdownEvent === event.id ? null : event.id)}
                  isAuthorized={isAuthorized}
                  onShare={() => handleShare(event.id, event.title)}
                  onPreferences={() => handleFillPreferences(event)}
                  onDelete={() => openDeleteModal(event.id, event.title)}
                  onCopy={() => handleCopyEvent(event)}
                  onEdit={isCreator ? () => handleEditEvent(event.id) : undefined}
                  canLeave={canLeave}
                  onLeave={canLeave ? () => openLeaveModal(event) : undefined}
                  isCreator={isCreator}
                  showPreferencesButton={true} // ou logique selon si l'utilisateur a déjà des préférences
                />
              );
            })}

            {/* Bouton Ajouter */}
            <Link
              href="/create-event"
              aria-label="Ajouter un évènement"
              className="w-full md:w-20 h-60 md:flex-shrink-0 flex items-center justify-center relative bg-white hover:bg-gray-50 transition group rounded-xl"
            >
              <svg
                className="absolute inset-0 w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 240"
                preserveAspectRatio="none"
              >
                <rect
                  x="2"
                  y="2"
                  width="96"
                  height="236"
                  rx="12"
                  fill="none"
                  stroke="#FCC638"
                  strokeWidth="2"
                  strokeDasharray="12 8"
                />
              </svg>
              <span className="relative z-10 text-6xl text-yellow-400 font-light">+</span>
            </Link>
          </div>

          {/* Lien "Tout voir" */}
          <div className="flex justify-end mt-4">
            <Link href="/events" className="text-body-large font-poppins text-black underline">
              Tout voir →
            </Link>
          </div>
        </section>

        {leaveModal && (
          <ConfirmationModal
            isOpen={leaveModal.isOpen}
            onClose={closeLeaveModal}
            onConfirm={handleLeaveEvent}
            title={`Quitter l'événement "${leaveModal.eventTitle}"`}
            message="Êtes-vous sûr de vouloir quitter cet événement ? Cette action est irréversible."
            confirmButtonText="Oui, quitter"
            cancelButtonText="Annuler"
            error={leaveError}
          />
        )}

        {deleteModal && (
          <ConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={closeDeleteModal}
            onConfirm={handleDeleteEvent}
            title={`Supprimer l'événement "${deleteModal.eventTitle}"`}
            message="Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible et supprimera définitivement l'événement."
            confirmButtonText="Oui, supprimer"
            cancelButtonText="Annuler"
            error={deleteError}
          />
        )}
      </main>
    </>
  );
}
