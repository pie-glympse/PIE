"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BackArrow from "@/components/ui/BackArrow";
import { ShareEventModal } from "@/components/layout/ShareEventModal";
import { StatusFilterButtons } from "@/components/ui/StatusFilterButtons";
import { ViewModeToggle } from "@/components/ui/ViewModeToggle";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventList } from "@/components/event/EventList";
import { useEvents, filterEventsByStatus, type EventType } from "@/hooks/useEvents";
import { useEventPreferences } from "@/hooks/useEventPreferences";

const TAGS = [
  { id: 1, name: "Restauration" },
  { id: 2, name: "Afterwork" },
  { id: 3, name: "Team Building" },
  { id: 4, name: "Séminaire" },
  { id: 5, name: "Autre" },
];

export default function EventForm() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const { events: userEvents, loading: eventsLoading, setEvents } = useEvents(user?.id);
  const { userEventPreferences } = useEventPreferences(user?.id);
  const [users, setUsers] = useState<{ id: string; name?: string; email?: string }[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [showPreferenceForm, setShowPreferenceForm] = useState(false);
  const [dropdownEvent, setDropdownEvent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'past' | 'upcoming' | 'preparation'>('all');

  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
  }>({
    isOpen: false,
    eventId: "",
    eventTitle: "",
  });

  // Redirection si pas connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Charger les participants pour chaque événement
  useEffect(() => {
    const hasEvents = userEvents.length > 0;
    const needParticipants = hasEvents && !userEvents[0]?.users;

    if (needParticipants) {
      const fetchParticipants = async () => {
        const eventsWithParticipants = await Promise.all(
          userEvents.map(async (event) => {
            try {
              const participantsRes = await fetch(`/api/events/${event.id}/users`);
              if (participantsRes.ok) {
                const participantsData = await participantsRes.json();
                return {
                  ...event,
                  users: participantsData.users || participantsData.userIds?.map((id: string) => ({
                    id,
                    firstName: "User",
                    lastName: id,
                    email: `user${id}@example.com`
                  })) || []
                };
              }
              return { ...event, users: [] };
            } catch (error) {
              console.error(`Erreur récupération participants pour event ${event.id}:`, error);
              return { ...event, users: [] };
            }
          })
        );
        setEvents(eventsWithParticipants);
      };

      fetchParticipants();
    }
  }, [userEvents, setEvents]);

  useEffect(() => {
    if (!isLoading && user && user.companyId) {
      fetch(`/api/users?companyId=${user.companyId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la récupération des utilisateurs");
          return res.json();
        })
        .then((data) => {
          setUsers(data);
          setFetchError(null);
        })
        .catch((err) => setFetchError(err.message));
    }
  }, [isLoading, user, user?.companyId]);

  if (isLoading || eventsLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) return null;

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((event) => event.id !== eventId));
        alert("Événement supprimé avec succès !");
      } else {
        alert("Erreur lors de la suppression de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors de la suppression :", error);
      alert("Erreur réseau lors de la suppression.");
    }
  };

  const handleEditEvent = (eventId: string) => {
    router.push(`/edit-event/${eventId}`);
  };

  const handleFillPreferences = (event: EventType) => {
    router.push(`/answer-event/${event.id}?eventTitle=${encodeURIComponent(event.title)}`);
  };

  const openShareModal = (eventId: string, eventTitle: string) => {
    setShareModal({ isOpen: true, eventId, eventTitle });
  };

  const closeShareModal = () => {
    setShareModal({ isOpen: false, eventId: "", eventTitle: "" });
  };

  const isAuthorized = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
  const filteredEvents = filterEventsByStatus(userEvents, statusFilter);

  return (
    <section className="overflow-y-auto md:overflow-hidden pt-24 p-6 flex flex-col gap-8">
      <div className="h-full w-full flex flex-col gap-6 items-start p-4 md:p-10">
        <BackArrow onClick={() => router.back()} className="!mb-0" />

        <div className="flex flex-col md:flex-row md:justify-between md:items-start w-full gap-4">
          <div className="flex flex-row items-center gap-4">
            <h1 className="text-h1 font-urbanist text-[var(--color-text)] mb-2">
              Tous vos événements
            </h1>
            <button className="">
              <Image src="/icons/filterIcon.svg" alt="Filtrer" width={24} height={24} className="" />
            </button>
          </div>
          <ViewModeToggle currentMode={viewMode} onModeChange={setViewMode} />
        </div>

        <StatusFilterButtons currentFilter={statusFilter} onFilterChange={setStatusFilter} />

        <div className="w-full flex-1 overflow-auto">
          <section>
            {fetchError && <p className="text-red-600 font-semibold">Erreur: {fetchError}</p>}

            {filteredEvents.length === 0 ? (
              <EmptyState onButtonClick={() => router.push('/create-event')} />
            ) : (
              <EventList
                events={filteredEvents}
                viewMode={viewMode}
                dropdownEvent={dropdownEvent}
                onDropdownToggle={(id) => setDropdownEvent(dropdownEvent === id ? null : id)}
                isAuthorized={isAuthorized}
                userEventPreferences={userEventPreferences}
                onEventClick={(id) => router.push(`/events/${id}`)}
                onShare={openShareModal}
                onPreferences={(event) => {
                  setSelectedEvent(event);
                  setShowPreferenceForm(true);
                }}
                onDelete={handleDeleteEvent}
                onEdit={handleEditEvent}
                currentUserId={user.id}
                onShowAddEvent={() => router.push('/create-event')}
                showAddButton={true}
              />
            )}
          </section>

          <ShareEventModal
            isOpen={shareModal.isOpen}
            onClose={closeShareModal}
            eventId={shareModal.eventId}
            eventTitle={shareModal.eventTitle}
            users={users}
            currentUserId={user.id}
          />

          {showPreferenceForm && selectedEvent && (
            <div className="fixed top-0 left-0 w-full h-full bg-white z-50 p-8 overflow-auto">
              <h2 className="text-2xl font-bold mb-6">
                Préférences pour : {selectedEvent.title}
              </h2>

              {step === 1 && (
                <>
                  <p className="mb-4">Choisissez un type d&apos;activité :</p>
                  <div className="flex gap-4 flex-wrap">
                    {TAGS.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTagId(tag.id)}
                        className={`p-3 rounded border ${
                          selectedTagId === tag.id
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100"
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <button
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={() => setStep(2)}
                    disabled={!selectedTagId}
                  >
                    Suivant
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="mb-4 mt-6">Choisissez une date préférée :</p>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <div className="mt-6 flex gap-4">
                    <button
                      className="px-4 py-2 bg-gray-300 rounded"
                      onClick={() => setStep(1)}
                    >
                      Retour
                    </button>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded"
                      onClick={() => handleFillPreferences(selectedEvent)}
                      disabled={!preferredDate}
                    >
                      Envoyer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
