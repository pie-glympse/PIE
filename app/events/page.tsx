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
  description?: string;
  date?: string;
  maxPersons?: string;
  costPerPerson?: string;
  state?: string;
  tags: { id: string; name: string }[];
};

export default function EventForm() {
  const { user, isLoading, logout } = useUser();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    maxPersons: "",
    costPerPerson: "",
    state: "",
    tags: [] as number[],
  });

  const [createdEvent, setCreatedEvent] = useState<EventType | null>(null);
  const [userEvents, setUserEvents] = useState<EventType[]>([]);
  const [users, setUsers] = useState<{ id: string; name?: string; email?: string }[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{
  isOpen: boolean;
  eventId: string;
  eventTitle: string;
}>({
  isOpen: false,
  eventId: '',
  eventTitle: ''
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
          if (!res.ok) throw new Error("Erreur lors de la récupération des événements");
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
    if (!isLoading && user) {
      fetch(`/api/users`)
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
  }, [isLoading, user]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) return null;

const handleLogout = async () => {
  try {
    // Appeler l'API de logout
    await fetch('/api/logout', { method: 'POST' });
    
    // Nettoyer le context
    logout();
    
    // Rediriger
    router.push('/login');
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    // Fallback: forcer la suppression du cookie
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    logout();
    router.push('/login');
  }
};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      ...formData,
      maxPersons: formData.maxPersons ? Number(formData.maxPersons) : null,
      costPerPerson: formData.costPerPerson
        ? Number(formData.costPerPerson)
        : null,
      date: formData.date ? new Date(formData.date).toISOString() : null,
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
          description: "",
          date: "",
          maxPersons: "",
          costPerPerson: "",
          state: "",
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
    eventTitle
  });
};

const closeShareModal = () => {
  setShareModal({
    isOpen: false,
    eventId: '',
    eventTitle: ''
  });
};

  const isAuthorized = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>Bonjour {user?.name || "invité"}</div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Se déconnecter
      </button>

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
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border p-2"
          />
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border p-2"
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

      {createdEvent && (
        <section className="mt-8 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-bold mb-2">Événement créé</h2>
          <p>
            <strong>Titre:</strong> {createdEvent.title}
          </p>
          <p>
            <strong>Description:</strong> {createdEvent.description || "—"}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {createdEvent.date
              ? new Date(createdEvent.date).toLocaleString()
              : "—"}
          </p>
          <p>
            <strong>Places max:</strong> {createdEvent.maxPersons || "—"}
          </p>
          <p>
            <strong>Coût par personne:</strong>{" "}
            {createdEvent.costPerPerson || "—"}
          </p>
          <p>
            <strong>État:</strong> {createdEvent.state || "—"}
          </p>
          <p>
            <strong>Catégories:</strong>{" "}
            {createdEvent.tags.map((t) => t.name).join(", ") || "—"}
          </p>

          <p className="mt-3">
            Lien de partage:{" "}
            <a
              href={`/event/${createdEvent.uuid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              /event/{createdEvent.uuid}
            </a>
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Vos événements</h2>
        {fetchError && (
          <p className="text-red-600 font-semibold">Erreur: {fetchError}</p>
        )}
        {userEvents.length === 0 && <p>Aucun événement trouvé.</p>}
        <ul className="space-y-2">
          {userEvents.map((event) => (
        <li key={event.id} className="border p-4 rounded shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <p className="text-sm text-gray-500">{event.description || "Pas de description"}</p>
            </div>
            {isAuthorized && (
              <button
              onClick={() => openShareModal(event.id, event.title)}
              className="ml-4 bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition"
            >
              Partager
            </button>
            )}
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
      />
    </div>
  );
}
