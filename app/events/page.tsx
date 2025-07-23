"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import { ShareEventModal } from "@/components/layout/ShareEventModal";

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

  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    maxPersons: "",
    costPerPerson: "",
    state: "",
    activityType: "",
    city: "",
    maxDistance: "",
    tags: [] as number[],
  });

  const [createdEvent, setCreatedEvent] = useState<EventType | null>(null);
  const [userEvents, setUserEvents] = useState<EventType[]>([]);
  const [userEventPreferences, setUserEventPreferences] = useState<
    Set<string>
  >(new Set());
  const [users, setUsers] = useState<
    { id: string; name?: string; email?: string }[]
  >([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagId: number) => {
    setFormData((prev) => {
      const alreadySelected = prev.tags.includes(tagId);
      return {
        ...prev,
        tags: alreadySelected
          ? prev.tags.filter((id) => id !== tagId)
          : [...prev.tags, tagId],
      };
    });
  };

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

  // ✅ Nouvelle fonction pour rediriger vers answer-event
  const handleFillPreferences = (event: EventType) => {
    router.push(`/answer-event/${event.id}?eventTitle=${encodeURIComponent(event.title)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      ...formData,
      maxPersons: formData.maxPersons ? Number(formData.maxPersons) : null,
      costPerPerson: formData.costPerPerson
        ? Number(formData.costPerPerson)
        : null,
      maxDistance: formData.maxDistance ? Number(formData.maxDistance) : null,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      startTime: formData.startTime ? new Date(`1970-01-01T${formData.startTime}`).toISOString() : null,
      endTime: formData.endTime ? new Date(`1970-01-01T${formData.endTime}`).toISOString() : null,
      tags: formData.tags,
      userId: user?.id,
    };

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const eventData = await response.json();
        setCreatedEvent(eventData);
        setFormData({
          title: "",
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          maxPersons: "",
          costPerPerson: "",
          state: "",
          activityType: "",
          city: "",
          maxDistance: "",
          tags: [],
        });
        setUserEvents((prev) => [...prev, eventData]);
      } else {
        alert("Erreur lors de la création de l'événement");
      }
    } catch (error) {
      alert("Erreur réseau ou serveur");
      console.error(error);
    }
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

  return (
    <div className="max-w-xl mx-auto space-y-6 mt-34">
      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Vos événements</h2>
        {fetchError && (
          <p className="text-red-600 font-semibold">Erreur: {fetchError}</p>
        )}
        {userEvents.length === 0 && <p>Aucun événement trouvé.</p>}
        <ul className="space-y-4">
          {userEvents.map((event) => (
            <li key={event.id} className="border p-6 rounded shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {event.startDate && (
                      <div>
                        <span className="font-medium">Date début:</span> {new Date(event.startDate).toLocaleDateString('fr-FR')}
                        {event.startTime && (
                          <span className="ml-2">à {new Date(event.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    )}
                    {event.endDate && (
                      <div>
                        <span className="font-medium">Date fin:</span> {new Date(event.endDate).toLocaleDateString('fr-FR')}
                        {event.endTime && (
                          <span className="ml-2">à {new Date(event.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    )}
                    {event.activityType && (
                      <div>
                        <span className="font-medium">Type d'activité:</span> {event.activityType}
                      </div>
                    )}
                    {event.city && (
                      <div>
                        <span className="font-medium">Ville:</span> {event.city}
                      </div>
                    )}
                    {event.maxDistance && (
                      <div>
                        <span className="font-medium">Distance max:</span> {event.maxDistance} km
                      </div>
                    )}
                    {event.maxPersons && (
                      <div>
                        <span className="font-medium">Places max:</span> {event.maxPersons}
                      </div>
                    )}
                    {event.costPerPerson && (
                      <div>
                        <span className="font-medium">Coût/pers:</span> {event.costPerPerson}€
                      </div>
                    )}
                    {event.state && (
                      <div>
                        <span className="font-medium">État:</span> {event.state}
                      </div>
                    )}
                  </div>
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Catégories:</span>
                      <div className="flex gap-2 mt-1">
                        {event.tags.map((tag) => (
                          <span key={tag.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 ml-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      onChange={() => handleDeleteEvent(event.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">Supprimer</span>
                  </label>

                  {isAuthorized && (
                    <button
                      onClick={() => openShareModal(event.id, event.title)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition text-sm"
                    >
                      Partager
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/events/${event.id}`)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Voir détails
                  </button>

                  {/* ✅ Conditionner l'affichage du bouton selon les préférences existantes */}
                  {!userEventPreferences.has(event.id) && (
                    <button
                      onClick={() => handleFillPreferences(event)}
                      className="text-blue-600 underline text-sm"
                    >
                      Remplir mes préférences
                    </button>
                  )}

                  {/* ✅ Optionnel: Afficher un indicateur si l'utilisateur a déjà des préférences */}
                  {userEventPreferences.has(event.id) && (
                    <span className="text-green-600 text-sm font-medium">
                      ✓ Préférences remplies
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
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

      {/* ✅ Supprimer complètement l'ancienne modal showPreferenceForm */}
    </div>
  );
}
