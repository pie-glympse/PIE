"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import GcardSkeleton from "@/components/GcardSkeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { EventsSection, type EventType } from "./EventsSection";

const GCalendar = dynamic(() => import("@/components/Gcalendar"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] rounded-lg bg-gray-100 animate-pulse" />
  ),
});

const Gcard = dynamic(() => import("@/components/Gcard"), {
  ssr: false,
});

function EventsSectionFallback() {
  return (
    <>
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Évènements à venir
      </h2>
      <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-2">
        <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
        <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
        <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
        <Link
          href="/create-event"
          aria-label="Ajouter un évènement"
          className="w-full md:w-20 h-60 md:flex-shrink-0 flex items-center justify-center relative bg-white hover:bg-gray-50 transition group rounded-xl border border-dashed border-gray-300"
        >
          <span className="text-6xl text-gray-300 font-light">+</span>
        </Link>
      </div>
      <div className="flex justify-end mt-4">
        <span className="text-body-large font-poppins text-black underline">
          Tout voir →
        </span>
      </div>
    </>
  );
}

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [refreshEventsKey, setRefreshEventsKey] = useState(0);
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

  const handleFillPreferences = useCallback(async (event: EventType) => {
    if (event.activityType) {
      const { getQuestionsForActivityType } = await import("@/lib/preferences/questionsConfig");
      const questions = getQuestionsForActivityType(event.activityType);
      if (questions.length > 0) {
        router.push(
          `/event-preferences/${event.id}?eventTitle=${encodeURIComponent(event.title)}`,
        );
        return;
      }
    }
    router.push(
      `/answer-event/${event.id}?eventTitle=${encodeURIComponent(event.title)}`,
    );
  }, [router]);

  // Rafraîchir la liste des événements (Suspense refetch via refreshKey)
  const refreshEvents = useCallback(() => setRefreshEventsKey((k) => k + 1), []);

  useEffect(() => {
    window.addEventListener("notificationsUpdated", refreshEvents);
    window.addEventListener("eventsUpdated", refreshEvents);
    return () => {
      window.removeEventListener("notificationsUpdated", refreshEvents);
      window.removeEventListener("eventsUpdated", refreshEvents);
    };
  }, [refreshEvents]);

  const getBackgroundUrl = useCallback((tags: { id: string; name: string }[]) => {
    if (tags.some((tag) => tag.name === "Restauration"))
      return "/images/illustration/palm.svg";
    if (tags.some((tag) => tag.name === "Afterwork"))
      return "/images/illustration/stack.svg";
    if (tags.some((tag) => tag.name === "Team Building"))
      return "/images/illustration/roundstar.svg";
    return "/images/illustration/roundstar.svg";
  }, []);

  const adaptEventForGcard = useCallback((event: EventType) => {
    return {
      title: event.title,
      date: event.date || new Date().toISOString(),
      participants: event.users || [],
      backgroundUrl: getBackgroundUrl(event.tags),
      state: event.state,
    };
  }, [getBackgroundUrl]);

  const openDeleteModal = useCallback((eventId: string, eventTitle: string) => {
    setDeleteError(null);
    setDeleteModal({
      isOpen: true,
      eventId,
      eventTitle,
    });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal(null);
    setDeleteError(null);
  }, []);

  const handleDeleteEvent = useCallback(async () => {
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
        closeDeleteModal();
        refreshEvents();
      } else {
        const errorData = await res.json();
        setDeleteError(
          errorData.error || "Erreur lors de la suppression de l'événement.",
        );
      }
    } catch (error) {
      console.error("Erreur réseau lors de la suppression :", error);
      setDeleteError("Erreur réseau lors de la suppression.");
    }
  }, [deleteModal, user, closeDeleteModal, refreshEvents]);

  const openLeaveModal = useCallback((event: EventType) => {
    setLeaveError(null);
    setLeaveModal({
      isOpen: true,
      eventId: event.id,
      eventTitle: event.title,
    });
  }, []);

  const closeLeaveModal = useCallback(() => {
    setLeaveModal(null);
    setLeaveError(null);
  }, []);

  const handleLeaveEvent = useCallback(async () => {
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
        closeLeaveModal();
        refreshEvents();
      } else {
        const errorData = await response.json();
        setLeaveError(
          errorData.error || "Erreur lors du départ de l'événement.",
        );
      }
    } catch (error) {
      console.error("Erreur réseau lors du départ de l'événement :", error);
      setLeaveError("Erreur réseau lors du départ de l'événement.");
    }
  }, [leaveModal, user, closeLeaveModal, refreshEvents]);

  const handleShare = useCallback((eventId: string, eventTitle: string) => {
    alert(`Partager l'événement: ${eventTitle}`);
  }, []);

  const handleEditEvent = useCallback((eventId: string) => {
    router.push(`/edit-event/${eventId}`);
  }, [router]);

  const handleCopyEvent = useCallback((event: EventType) => {
    const formatDate = (dateString: string | undefined) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    const formatTime = (timeString: string | undefined) => {
      if (!timeString) return "";
      const time = new Date(timeString);
      return time.toTimeString().split(" ")[0].substring(0, 5);
    };

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
    if (event.recurring !== undefined)
      params.set("recurring", event.recurring.toString());
    if (event.duration) params.set("duration", event.duration);
    if (event.recurringRate) params.set("recurringRate", event.recurringRate);

    router.push(`/create-event?${params.toString()}`);
  }, [router]);

  const isAuthorized = useMemo(() => 
    user ? ["ADMIN", "SUPER_ADMIN"].includes(user.role) : false,
    [user]
  );

  if (isLoading) {
    return <div>Chargement...</div>;
  }

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
          {user && (
            <EventsSection
              userId={user.id}
              refreshKey={refreshEventsKey}
              fallback={<EventsSectionFallback />}
            >
                {({ events, error }) => (
                  <>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                      {events.length > 0
                        ? "Évènements à venir"
                        : "Pas d'évènement à venir"}
                    </h2>
                    {error && (
                      <p className="text-red-600 font-semibold mb-4">
                        {error}
                      </p>
                    )}
                    <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:pb-2">
                      {events.length === 0 && !error && (
                        <p className="text-gray-500">
                          Aucun événement trouvé.
                        </p>
                      )}
                      {events.slice(0, 3).map((event) => {
                        const isCreator = !!(
                          event.createdBy?.id &&
                          String(event.createdBy.id) === String(user.id)
                        );
                        const isParticipant =
                          event.users?.some(
                            (u) => String(u.id) === String(user?.id)
                          ) ?? false;
                        const canLeave = !isCreator && isParticipant;

                        return (
                          <Gcard
                            key={event.id}
                            eventId={event.id}
                            {...adaptEventForGcard(event)}
                            className="w-full md:w-100 h-60 md:flex-shrink-0"
                            dropdownOpen={dropdownEvent === event.id}
                            onDropdownToggle={() =>
                              setDropdownEvent(
                                dropdownEvent === event.id ? null : event.id
                              )
                            }
                            isAuthorized={isAuthorized}
                            onShare={() => handleShare(event.id, event.title)}
                            onPreferences={() => handleFillPreferences(event)}
                            onDelete={() =>
                              openDeleteModal(event.id, event.title)
                            }
                            onCopy={() => handleCopyEvent(event)}
                            onEdit={
                              isCreator
                                ? () => handleEditEvent(event.id)
                                : undefined
                            }
                            canLeave={canLeave}
                            onLeave={
                              canLeave
                                ? () => openLeaveModal(event)
                                : undefined
                            }
                            isCreator={isCreator}
                            showPreferencesButton={true}
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
                        <span className="relative z-10 text-6xl text-yellow-400 font-light">
                          +
                        </span>
                      </Link>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Link
                        href="/events"
                        className="text-body-large font-poppins text-black underline"
                      >
                        Tout voir →
                      </Link>
                    </div>
                  </>
                )}
            </EventsSection>
          )}

          {!user && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Pas d&apos;évènement à venir
              </h2>
              <p className="text-gray-500">Connectez-vous pour voir vos événements.</p>
            </>
          )}
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
