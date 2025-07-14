"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/navigation";
import { ShareEventModal } from "@/components/layout/ShareEventModal";

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
        data.forEach((pref: { eventId: number; preferredDate: string; tagId: number }) => {
          preferenceMap.set(pref.eventId, pref);
        });
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
        // Rafraîchir la liste des events du user
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
    <div className="max-w-xl mx-auto space-y-6">
      <div>Bonjour {user?.name || "invité"}</div>

      {isAuthorized ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="title"
            placeholder="Titre"
            value={formData.title}
            onChange={handleChange}
            className="w-full border p-2"
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date de début</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date de fin</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full border p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Heure de début</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Heure de fin</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full border p-2"
              />
            </div>
          </div>

          <input
            type="text"
            name="activityType"
            placeholder="Type d'activité"
            value={formData.activityType}
            onChange={handleChange}
            className="w-full border p-2"
          />

          <input
            type="text"
            name="city"
            placeholder="Ville"
            value={formData.city}
            onChange={handleChange}
            className="w-full border p-2"
          />

          <input
            type="number"
            name="maxDistance"
            placeholder="Distance maximale (km)"
            value={formData.maxDistance}
            onChange={handleChange}
            className="w-full border p-2"
            min={0}
            step="0.1"
          />
          <input
            type="number"
            name="maxPersons"
            placeholder="Places max"
            value={formData.maxPersons}
            onChange={handleChange}
            className="w-full border p-2"
            min={1}
          />
          <input
            type="number"
            name="costPerPerson"
            placeholder="Coût/pers."
            value={formData.costPerPerson}
            onChange={handleChange}
            className="w-full border p-2"
            min={0}
          />
          <input
            type="text"
            name="state"
            placeholder="État (ex: Brouillon, Publié...)"
            value={formData.state}
            onChange={handleChange}
            className="w-full border p-2"
          />

          <fieldset>
            <legend>Catégories</legend>
            {TAGS.map((tag) => (
              <label key={tag.id} className="block">
                <input
                  type="checkbox"
                  checked={formData.tags.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                />{" "}
                {tag.name}
              </label>
            ))}
          </fieldset>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Créer l’événement
          </button>
        </form>
      ) : (
        <p className="mt-6 text-red-600 font-semibold">
          Vous n’êtes pas autorisé à créer des événements.
        </p>
      )}

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
                <span className="font-medium">Type d&apos;activité:</span> {event.activityType}
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
          {/* Checkbox pour supprimer l'événement */}
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

          {!userEventPreferences.has(Number(event.id)) && (
            <button
              onClick={() => {
                setSelectedEvent(event);
                setShowPreferenceForm(true);
              }}
              className="text-blue-600 underline text-sm"
            >
              Remplir mes préférences
            </button>
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
  users={users}  // <-- ici
  currentUserId={user.id}
/>
      {showPreferenceForm && selectedEvent && (
        <div className="fixed top-0 left-0 w-full h-full bg-white z-50 p-8 overflow-auto">
          <h2 className="text-2xl font-bold mb-6">
            Préférences pour : {selectedEvent.title}
          </h2>

          {step === 1 && (
            <>
              <p className="mb-4">Choisissez un type d’activité :</p>
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
  );
}
