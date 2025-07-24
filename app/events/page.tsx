"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BackArrow from "@/components/ui/BackArrow";
import Gcard from "@/components/Gcard/Gcard";
import { ShareEventModal } from "@/components/layout/ShareEventModal";
import MainButton from "@/components/ui/MainButton";

const TAGS = [
  { id: 1, name: "Restauration" },
  { id: 2, name: "Afterwork" },
  { id: 3, name: "Team Building" },
  { id: 4, name: "Séminaire" },
  { id: 5, name: "Autre" },
];

export type EventType = {
  id: string;
  uuid: string;
  title: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  maxPersons?: string;
  costPerPerson?: string;
  state?: string;
  activityType?: string;
  city?: string;
  maxDistance?: number;
  tags: { id: string; name: string }[];
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }[];
};

export default function EventForm() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [userEvents, setUserEvents] = useState<EventType[]>([]);
  const [userEventPreferences, setUserEventPreferences] = useState<
    Set<string>
  >(new Set());
  const [eventPopularTags, setEventPopularTags] = useState<
    Map<string, { id: string; name: string; count: number }>
  >(new Map());
  const [users, setUsers] = useState<
    { id: string; name?: string; email?: string }[]
  >([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [showPreferenceForm, setShowPreferenceForm] = useState(false);

  const [dropdownEvent, setDropdownEvent] = useState<string | null>(null);

  // État pour la vue (grid ou list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // État pour le filtrage par statut
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

  // Charger les events du user
  useEffect(() => {
    if (!isLoading && user) {
      setEventsLoading(true);
      fetch(`/api/events?userId=${user.id}`)
        .then((res) => {
          if (!res.ok)
            throw new Error("Erreur lors de la récupération des événements");
          return res.json();
        })
        .then((data) => {
          setUserEvents(data);
          setFetchError(null);
        })
        .catch((err) => setFetchError(err.message))
        .finally(() => setEventsLoading(false));
    }
  }, [isLoading, user]);

  // Charger les participants pour chaque événement séparément
  useEffect(() => {
    if (userEvents.length > 0) {
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
        setUserEvents(eventsWithParticipants);
      };
      
      fetchParticipants();
    }
  }, [userEvents.length > 0 && !userEvents[0]?.users]);

  // ✅ Charger les préférences existantes de l'utilisateur
  useEffect(() => {
    if (!isLoading && user) {
      const fetchUserPreferences = async () => {
        try {
          const response = await fetch(`/api/user-event-preferences?userId=${user.id}`);
          if (response.ok) {
            const preferences = await response.json();
            // Créer un Set avec les eventIds pour lesquels l'utilisateur a des préférences
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
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (userEvents.length > 0 && user) {
      const fetchPreferences = async () => {
        const res = await fetch(
          `/api/user-event-preferences?userId=${user.id}`
        );
        const data = await res.json();
        // Extract event IDs and store in a Set<string>
        const eventIds = new Set<string>(
          data.map((pref: { eventId: string | number }) => String(pref.eventId))
        );
        setUserEventPreferences(eventIds);
      };
      fetchPreferences();
    }
  }, [userEvents, user]);

  useEffect(() => {
    if (!isLoading && user) {
      fetch(`/api/users`)
        .then((res) => {
          if (!res.ok)
            throw new Error("Erreur lors de la récupération des utilisateurs");
          return res.json();
        })
        .then((data) => {
          setUsers(data);
          setFetchError(null);
        })
        .catch((err) => setFetchError(err.message));
    }
  }, [isLoading, user]);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        if (!user || !selectedEvent) return;
        const res = await fetch(
          `/api/preferences?userId=${user.id}&eventId=${selectedEvent.id}`
        );
        if (!res.ok) {
          setPreferences(null);
        } else {
          const data = await res.json();
          setPreferences(data);
        }
      } catch (error) {
        console.error("Erreur fetch preferences:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, [user, selectedEvent]);

  if (isLoading || eventsLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) return null;

  // Fonction pour supprimer un événement
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUserEvents((prev) => prev.filter((event) => event.id !== eventId));
        alert("Événement supprimé avec succès !");
      } else {
        alert("Erreur lors de la suppression de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors de la suppression :", error);
      alert("Erreur réseau lors de la suppression.");
    }
  };
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUserEvents((prev) => prev.filter((event) => event.id !== eventId));
        alert("Événement supprimé avec succès !");
      } else {
        alert("Erreur lors de la suppression de l'événement.");
      }
    } catch (error) {
      console.error("Erreur réseau lors de la suppression :", error);
      alert("Erreur réseau lors de la suppression.");
    }
  };

  // ✅ Nouvelle fonction pour rediriger vers answer-event
  const handleFillPreferences = (event: EventType) => {
    router.push(`/answer-event/${event.id}?eventTitle=${encodeURIComponent(event.title)}`);
  };

  const adaptEventForGcard = (event: EventType) => {
    const getBackgroundUrl = (tags: { id: string; name: string }[]) => {
      if (tags.some((tag) => tag.name === "Restauration"))
        return "/images/illustration/palm.svg";
      if (tags.some((tag) => tag.name === "Afterwork"))
        return "/images/illustration/stack.svg";
      if (tags.some((tag) => tag.name === "Team Building"))
        return "/images/illustration/roundstar.svg";
      return "/images/illustration/roundstar.svg";
    };

    return {
      title: event.title,
      date: event.startDate || new Date().toISOString(),
      participants: event.users || [],
      backgroundUrl: getBackgroundUrl(event.tags),
    };
  };

  const openShareModal = (eventId: string, eventTitle: string) => {
    setShareModal({
      isOpen: true,
      eventId,
      eventTitle,
    });
  };

  const closeShareModal = () => {
    setShareModal({
      isOpen: false,
      eventId: "",
      eventTitle: "",
    });
  };

  const isAuthorized = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

  // Fonction pour filtrer les événements par statut
  const getFilteredEvents = () => {
    const now = new Date();
    return userEvents.filter(event => {
      if (statusFilter === 'all') return true;
      
      const eventDate = new Date(event.startDate || '');
      
      if (statusFilter === 'past') {
        return eventDate < now;
      }
      if (statusFilter === 'upcoming') {
        return eventDate > now && event.state !== 'preparation';
      }
      if (statusFilter === 'preparation') {
        return event.state === 'preparation' || event.state === 'PREPARATION';
      }
      
      return true;
    });
  };

  const filteredEvents = getFilteredEvents();

  return (
    <section className="h-screen overflow-y-auto md:overflow-hidden pt-24 p-6 flex flex-col gap-8">
      <div className="h-full w-full flex flex-col gap-6 items-start p-4 md:p-10">
        {/* Header avec logo et back arrow */}
        <BackArrow onClick={() => router.back()} className="" />

        {/* Header de la page */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start w-full gap-4">
            <div className="flex flex-row items-center gap-4 ">
            <h1 className="text-h1 font-urbanist text-[var(--color-text)] mb-2">
              Tous vos événements
            </h1>
            <button className="">
              <img src="/icons/filterIcon.svg" alt="Filtrer" className="" />
            </button>
          </div>
            <div className="hidden md:flex flex-row items-center gap-4">
            <button className="">
              <img src="/icons/calendar.svg" alt="Vue Calendrier" className="" />
            </button>
            <button 
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[var(--color-grey-one)]' : 'hover:bg-gray-100'}`}
              onClick={() => setViewMode('list')}
            >
              <img src="/icons/list.svg" alt="Vue Liste" className="" />
            </button>
            <button 
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[var(--color-grey-one)]' : 'hover:bg-gray-100'}`}
              onClick={() => setViewMode('grid')}
            >
              <img src="/icons/grid.svg" alt="Vue grid" className="" />
            </button>
          </div>
        </div>

        {/* Filtres des évenements par date */}
        <div className="flex flex-row items-center gap-4 w-full flex-wrap">
            <button 
              className={`px-2 py-1 rounded text-body-large ${statusFilter === 'all' ? 'bg-black text-white' : 'bg-[var(--color-grey-one)] text-[var(--color-text)]'}`}
              onClick={() => setStatusFilter('all')}
            >
              Tous
            </button>
            <button 
              className={`px-2 py-1 rounded text-body-large ${statusFilter === 'past' ? 'bg-black text-white' : 'bg-[var(--color-grey-one)] text-[var(--color-text)]'}`}
              onClick={() => setStatusFilter('past')}
            >
              Passés
            </button>
            <button 
              className={`px-2 py-1 rounded text-body-large ${statusFilter === 'upcoming' ? 'bg-black text-white' : 'bg-[var(--color-grey-one)] text-[var(--color-text)]'}`}
              onClick={() => setStatusFilter('upcoming')}
            >
              À venir
            </button>
        </div>

        {/* Liste des événements */}
        <div className="w-full flex-1 overflow-auto">
          <section>
            {fetchError && (
              <p className="text-red-600 font-semibold">Erreur: {fetchError}</p>
            )}
            
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full min-h-96 py-16">
                <div className="text-center space-y-3">
                  <img
                    src="/images/mascotte/sad.png"
                    alt="Mascotte triste"
                    className="mx-auto object-contain opacity-80 w-60 h-60"
                  />
                  <div className="space-y-4">
                    <h3 className="text-2xl font-semibold text-gray-800 font-urbanist">
                      Aucun événement trouvé
                    </h3>
                    <p className="text-gray-500 text-lg max-w-md mx-auto font-poppins">
                      Il semble qu'il n'y ait aucun événement correspondant à vos critères. Pourquoi ne pas créer le premier ?
                    </p>
                  </div>
                  <div className="pt-4">
                    <MainButton 
                      onClick={() => router.push('/create-event')}
                      text="Créer mon premier événement" 
                      color={"bg-[var(--color-main)]"}                   
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="cursor-pointer"
                      >
                        <Gcard
                          eventId={event.id}
                          {...adaptEventForGcard(event)}
                          className="w-full h-60"
                          dropdownOpen={dropdownEvent === event.id}
                          onDropdownToggle={() => setDropdownEvent(
                            dropdownEvent === event.id ? null : event.id
                          )}
                          isAuthorized={isAuthorized}
                          onShare={() => openShareModal(event.id, event.title)}
                          onPreferences={() => {
                            setSelectedEvent(event);
                            setShowPreferenceForm(true);
                          }}
                          onDelete={() => handleDeleteEvent(event.id)}
                          showPreferencesButton={!userEventPreferences.has(event.id)}
                        />
                      </div>
                    ))}
                    {/* Bouton Ajouter */}
                    <button
                      onClick={() => router.push('/create-event')}
                      aria-label="Ajouter un évènement"
                      className="w-full md:w-20 h-60 flex-shrink-0 flex items-center bg-[var(--color-main)] justify-center rounded-xl hover:opacity-80 transition text-h1 text-white"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="cursor-pointer"
                      >
                        <Gcard
                          eventId={event.id}
                          {...adaptEventForGcard(event)}
                          className="w-full ha-auto"
                          dropdownOpen={dropdownEvent === event.id}
                          onDropdownToggle={() => setDropdownEvent(
                            dropdownEvent === event.id ? null : event.id
                          )}
                          isAuthorized={isAuthorized}
                          onShare={() => openShareModal(event.id, event.title)}
                          onPreferences={() => {
                            setSelectedEvent(event);
                            setShowPreferenceForm(true);
                          }}
                          onDelete={() => handleDeleteEvent(event.id)}
                          showPreferencesButton={!userEventPreferences.has(event.id)}
                        />
                      </div>
                    ))}
                    {/* Bouton Ajouter en mode liste */}
                    <button
                      onClick={() => router.push('/create-event')}
                      aria-label="Ajouter un évènement"
                      className="w-full h-16 flex items-center justify-center bg-[var(--color-main)] text-white rounded-lg hover:opacity-80 transition text-lg font-semibold"
                    >
                      + Ajouter un événement
                    </button>
                  </div>
                )}
              </>
            )}

          </section>
          {/* Modal de partage */}
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
                  <p className="mb-4">Choisissez un type d'activité :</p>
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