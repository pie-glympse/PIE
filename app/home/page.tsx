"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import GcardSkeleton from "@/components/GcardSkeleton";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { EventsSection, type EventType } from "./EventsSection";
import { useJoinPublicEvent } from "@/hooks/useJoinPublicEvent";
import { useEventPreferences } from "@/hooks/useEventPreferences";
import { useToast } from "@/context/ToastContext";
import {
    getEventIllustration,
    formatEventCreatedAt,
} from "@/lib/event-display";
import { canShowEventPreferencesVote } from "@/lib/event-public";

const GCalendar = dynamic(() => import("@/components/Gcalendar"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] rounded-lg bg-gray-100 animate-pulse" />
  ),
});

const Gcard = dynamic(() => import("@/components/Gcard"), {
  ssr: false,
});

function EventActionsColumn() {
  return (
    <div className="flex flex-col gap-2 w-full md:flex-1 md:min-w-0 h-60">
      <Link
        href="/events"
        className="flex-1 flex items-center justify-center rounded-xl bg-[var(--color-tertiary)] text-white font-poppins text-body-small font-medium shadow-md hover:opacity-90 transition"
      >
        Tous les événements
      </Link>
      <Link
        href="/create-event"
        className="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-main)] text-[var(--color-main-text)] font-poppins text-body-small font-medium hover:bg-[var(--color-main)]/10 transition"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-dashed border-[var(--color-main)] text-2xl leading-none">
          +
        </span>
        Créer un événement
      </Link>
    </div>
  );
}

function EventsSectionFallback() {
  return (
    <>
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Évènements à venir
      </h2>
      <div className="flex flex-col md:flex-row gap-4 md:pb-2 w-full">
        <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
        <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
        <GcardSkeleton className="w-full md:w-100 h-60 md:flex-shrink-0" />
        <EventActionsColumn />
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<EventsSectionFallback />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const newEventId = searchParams.get("newEvent");
  const { showPointsToast } = useToast();
  const { userEventPreferences } = useEventPreferences(user?.id);
  const [refreshEventsKey, setRefreshEventsKey] = useState(0);
  const [dropdownEvent, setDropdownEvent] = useState<string | null>(null);
  const [leaveModal, setLeaveModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
    isPublic?: boolean;
  } | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{
    icon: string;
    name: string;
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleFillPreferences = useCallback(
    async (event: EventType) => {
      router.push(
        `/event-preferences/${event.id}?eventTitle=${encodeURIComponent(event.title)}`,
      );
    },
    [router],
  );

  // Rafraîchir la liste des événements (Suspense refetch via refreshKey)
  const refreshEvents = useCallback(
    () => setRefreshEventsKey((k) => k + 1),
    [],
  );
  const { joinEvent, joiningEventId } = useJoinPublicEvent(refreshEvents);

  // Récupérer le badge sélectionné
  useEffect(() => {
    if (!isLoading && user) {
      fetch(`/api/badges?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.selectedBadgeId) {
            const selected = data.badges.find(
              (b: any) => b.id.toString() === data.selectedBadgeId.toString(),
            );
            if (selected) {
              setSelectedBadge({ icon: selected.icon, name: selected.name });
            }
          }
        })
        .catch((err) =>
          console.error("Erreur lors de la récupération du badge:", err),
        );
    }
  }, [isLoading, user]);

  useEffect(() => {
    window.addEventListener("notificationsUpdated", refreshEvents);
    window.addEventListener("eventsUpdated", refreshEvents);
    return () => {
      window.removeEventListener("notificationsUpdated", refreshEvents);
      window.removeEventListener("eventsUpdated", refreshEvents);
    };
  }, [refreshEvents]);

  useEffect(() => {
    if (!newEventId) return;
    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`event-card-${newEventId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);
    const cleanTimer = window.setTimeout(() => {
      router.replace("/home", { scroll: false });
    }, 4000);
    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(cleanTimer);
    };
  }, [newEventId, router]);

  const adaptEventForGcard = useCallback((event: EventType, index: number) => {
    return {
      title: event.title,
      date: formatEventCreatedAt(event.createdAt) || new Date().toISOString(),
      participants: event.users || [],
      backgroundUrl: getEventIllustration(index),
      state: event.state,
    };
  }, []);

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
      isPublic: event.isPublic,
    });
  }, []);

  const handleParticipate = useCallback(
    async (event: EventType) => {
      if (!user?.id || !event.isPublic) return;
      const isCreator = !!(
        event.createdBy?.id && String(event.createdBy.id) === String(user.id)
      );
      if (isCreator || event.isParticipant) return;
      const result = await joinEvent(event.id, user.id);
      if (result) showPointsToast(50, "avoir rejoint un événement");
    },
    [user?.id, joinEvent, showPointsToast],
  );

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

  const handleEditEvent = useCallback(
    (eventId: string) => {
      router.push(`/edit-event/${eventId}`);
    },
    [router],
  );

  const handleCopyEvent = useCallback(
    (event: EventType) => {
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
      if (event.recurring !== undefined)
        params.set("recurring", event.recurring.toString());
      if (event.duration) params.set("duration", event.duration);
      if (event.recurringRate) params.set("recurringRate", event.recurringRate);

      router.push(`/create-event?${params.toString()}`);
    },
    [router],
  );

  const isAuthorized = useMemo(
    () => (user ? ["ADMIN", "SUPER_ADMIN"].includes(user.role) : false),
    [user],
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
            <Link
              href="/ranking"
              className="cursor-pointer hover:scale-110 transition-transform"
            >
              {selectedBadge ? (
                selectedBadge.icon.startsWith("/") ? (
                  <Image
                    src={selectedBadge.icon}
                    alt={selectedBadge.name}
                    width={300}
                    height={300}
                    className="w-13 h-13 object-contain"
                  />
                ) : (
                  <span className="text-2xl">{selectedBadge.icon}</span>
                )
              ) : (
                <Image
                  src="/images/icones/pastille.svg"
                  alt="Statut utilisateur"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
              )}
            </Link>
          </div>
        </section>

        {/* Calendrier (la légende des couleurs est intégrée au calendrier) */}
        <section>
          <GCalendar year={2025} />
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
                    <p className="text-red-600 font-semibold mb-4">{error}</p>
                  )}
                  <div className="flex flex-col md:flex-row gap-4 md:pb-2 w-full">
                    {events.length === 0 && !error && (
                      <p className="text-gray-500">Aucun événement trouvé.</p>
                    )}
                    {events.slice(0, 3).map((event, index) => {
                      const isCreator = !!(
                        event.createdBy?.id &&
                        String(event.createdBy.id) === String(user.id)
                      );
                      const isParticipant =
                        event.users?.some(
                          (u) => String(u.id) === String(user?.id),
                        ) ?? false;
                      const canLeave = !isCreator && isParticipant;
                      const userIsParticipant =
                        (event.isParticipant ?? isParticipant) || isCreator;

                      return (
                        <div key={event.id} id={`event-card-${event.id}`}>
                          <Gcard
                            eventId={event.id}
                            {...adaptEventForGcard(event, index)}
                            className="w-full md:w-100 h-60 md:flex-shrink-0"
                            dropdownOpen={dropdownEvent === event.id}
                            onDropdownToggle={() =>
                              setDropdownEvent(
                                dropdownEvent === event.id ? null : event.id,
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
                              canLeave ? () => openLeaveModal(event) : undefined
                            }
                            isCreator={isCreator}
                            showPreferencesButton={canShowEventPreferencesVote({
                              isParticipant: userIsParticipant,
                              isCreator,
                              hasPreferences: userEventPreferences.has(
                                event.id,
                              ),
                              state: event.state,
                              dateKnown: event.dateKnown,
                              isSpecificPlace: event.isSpecificPlace,
                            })}
                            isNew={newEventId === event.id}
                            isPublic={event.isPublic}
                            participantCount={
                              event.participantCount ?? event.users?.length ?? 0
                            }
                            maxParticipants={
                              event.maxParticipants ??
                              (event.maxPersons
                                ? Number(event.maxPersons)
                                : null)
                            }
                            isParticipant={userIsParticipant}
                            isFull={event.isFull}
                            joinLoading={joiningEventId === event.id}
                            hideParticipateButton={isCreator}
                            onParticipate={
                              event.isPublic && !isCreator
                                ? () => handleParticipate(event)
                                : undefined
                            }
                          />
                        </div>
                      );
                    })}

                    <EventActionsColumn />
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
              <p className="text-gray-500">
                Connectez-vous pour voir vos événements.
              </p>
            </>
          )}
        </section>

        {leaveModal && (
          <ConfirmationModal
            isOpen={leaveModal.isOpen}
            onClose={closeLeaveModal}
            onConfirm={handleLeaveEvent}
            title={`Quitter l'événement "${leaveModal.eventTitle}"`}
            message={
              leaveModal.isPublic
                ? "Souhaitez-vous vraiment quitter cet événement ? Votre place sera libérée."
                : "Êtes-vous sûr de vouloir quitter cet événement ? Cette action est irréversible."
            }
            confirmButtonText="Quitter l'événement"
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
