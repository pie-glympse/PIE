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

type EventType = {
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
};

export default function EventForm() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  const [userEvents, setUserEvents] = useState<EventType[]>([]);
  const [userEventPreferences, setUserEventPreferences] = useState<
    Map<number, { eventId: number; preferredDate: string; tagId: number }>
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
        .catch((err) => setFetchError(err.message));
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (userEvents.length > 0 && user) {
      const fetchPreferences = async () => {
        const res = await fetch(
          `/api/user-event-preferences?userId=${user.id}`
        );
        const data = await res.json(); // Format: [{ eventId: X, preferredDate: ..., tagId: ... }]
        const preferenceMap = new Map();
        data.forEach(
          (pref: { eventId: number; preferredDate: string; tagId: number }) => {
            preferenceMap.set(pref.eventId, pref);
          }
        );
        setUserEventPreferences(preferenceMap); // New state
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
        // Only fetch if user and selectedEvent are defined
        if (!user || !selectedEvent) return;
        const res = await fetch(
          `/api/preferences?userId=${user.id}&eventId=${selectedEvent.id}`
        );
        if (!res.ok) {
          // Pas de préférence en base
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
    // Only run when user or selectedEvent changes
  }, [user, selectedEvent]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) return null;

  if (loading) return <p>Chargement...</p>;

  // Fonction pour supprimer un événement
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Mise à jour locale en supprimant l'event supprimé
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

  const handleSubmitPreferences = async () => {
    if (!user || !selectedEvent || !selectedTagId || !preferredDate) return;

    const body = {
      userId: user.id,
      eventId: selectedEvent.id,
      tagId: selectedTagId,
      preferredDate,
    };

    try {
      const res = await fetch(`/api/events/${selectedEvent.id}/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Préférences enregistrées !");
        setShowPreferenceForm(false);
        setSelectedEvent(null);
        setSelectedTagId(null);
        setPreferredDate("");
        setStep(1);

        // Rafraîchir les préférences
        const updatedPrefs = await res.json();
        setUserEventPreferences(
          (prev) => new Map(prev.set(Number(selectedEvent.id), updatedPrefs))
        );
      } else {
        alert("Erreur lors de l'envoi des préférences");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    }
  };

  // Fonction pour adapter les données de l'API au format attendu par Gcard
  const adaptEventForGcard = (event: EventType) => {
    // Assigner différentes images de fond selon les tags
    const getBackgroundUrl = (tags: { id: string; name: string }[]) => {
      if (tags.some((tag) => tag.name === "Restauration"))
        return "/images/illustration/palm.svg";
      if (tags.some((tag) => tag.name === "Afterwork"))
        return "/images/illustration/stack.svg";
      if (tags.some((tag) => tag.name === "Team Building"))
        return "/images/illustration/roundstar.svg";
      return "/images/illustration/roundstar.svg"; // Par défaut
    };

    return {
      title: event.title,
      date: event.startDate || new Date().toISOString(),
      profiles: [
        "/img/user1.jpg",
        "/img/user2.jpg",
        "/img/user3.jpg",
        "/img/user4.jpg",
        "/img/user5.jpg",
      ],
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
    <section className="flex flex-row h-screen items-start gap-10 p-10">
      <div className="h-full w-full flex flex-col gap-6 items-start p-10">
        {/* Header avec logo et back arrow */}
        <p className="text-left">LOGO ICI</p>
        <BackArrow onClick={() => router.back()} className="" />

        {/* Header de la page */}
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-row items-center gap-4">
            <h1 className="text-h1 font-urbanist text-[var(--color-text)] mb-2">
              Tous vos événements
            </h1>
            <button className="">
              <img src="/icons/filterIcon.svg" alt="Filtrer" className="" />
            </button>
          </div>
          <div className="flex flex-row items-center gap-4">
            <button className="">
              <img src="/icons/calendar.svg" alt="Vue Calendrier" className="" />
            </button>
            <button 
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              onClick={() => setViewMode('list')}
            >
              <img src="/icons/list.svg" alt="Vue Liste" className="" />
            </button>
            <button 
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              onClick={() => setViewMode('grid')}
            >
              <img src="/icons/grid.svg" alt="Vue grid" className="" />
            </button>
          </div>
        </div>

        {/* Filtres des évenements par date */}
        <div className="flex flex-row items-center gap-4 w-full">
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
            <button 
              className={`px-2 py-1 rounded text-body-large ${statusFilter === 'preparation' ? 'bg-black text-white' : 'bg-[var(--color-grey-one)] text-[var(--color-text)]'}`}
              onClick={() => setStatusFilter('preparation')}
            >
              En préparation
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
                <div className="text-center space-y-8">
                  <img
                    src="/images/mascotte/sad.png"
                    alt="Mascotte triste"
                    className="mx-auto object-contain opacity-80"
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
                      color="primary"
                      text="Créer mon premier événement"
                      onClick={() => router.push('/create-event')}
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
                          {...adaptEventForGcard(event)}
                          className="w-full h-60"
                          dropdownOpen={dropdownEvent === event.id}
                          onDropdownToggle={() =>
                            setDropdownEvent(
                              dropdownEvent === event.id ? null : event.id
                            )
                          }
                          isAuthorized={isAuthorized}
                          onShare={() => openShareModal(event.id, event.title)}
                          onPreferences={() => {
                            setSelectedEvent(event);
                            setShowPreferenceForm(true);
                          }}
                          onDelete={() => handleDeleteEvent(event.id)}
                          showPreferencesButton={
                            !userEventPreferences.has(Number(event.id))
                          }
                        />
                      </div>
                    ))}
                    {/* Bouton Ajouter */}
                    <button
                      onClick={() => router.push('/create-event')}
                      aria-label="Ajouter un évènement"
                      className="w-20 h-60 flex-shrink-0 flex items-center bg-[var(--color-main)] justify-center rounded-xl hover:opacity-80 transition text-h1 text-white"
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
                          {...adaptEventForGcard(event)}
                          className="w-full h-24"
                          dropdownOpen={dropdownEvent === event.id}
                          onDropdownToggle={() =>
                            setDropdownEvent(
                              dropdownEvent === event.id ? null : event.id
                            )
                          }
                          isAuthorized={isAuthorized}
                          onShare={() => openShareModal(event.id, event.title)}
                          onPreferences={() => {
                            setSelectedEvent(event);
                            setShowPreferenceForm(true);
                          }}
                          onDelete={() => handleDeleteEvent(event.id)}
                          showPreferencesButton={
                            !userEventPreferences.has(Number(event.id))
                          }
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
                      onClick={handleSubmitPreferences}
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