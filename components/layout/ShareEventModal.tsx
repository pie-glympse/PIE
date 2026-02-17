"use client";

import { useState, useEffect, useMemo } from "react";

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type ShareEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  currentUserId: string;
  users: User[];
};

export const ShareEventModal = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  currentUserId,
  users,
}: ShareEventModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkedUserIds, setLinkedUserIds] = useState<string[]>([]);

  // Charger les utilisateurs déjà liés quand le modal s'ouvre
  useEffect(() => {
    if (!isOpen) return;

    const fetchLinkedUsers = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/users`);
        if (!res.ok) {
          throw new Error("Impossible de récupérer les utilisateurs liés");
        }
        const data = await res.json();
        setLinkedUserIds(data.userIds || []);
      } catch (err) {
        console.error(err);
        setLinkedUserIds([]); // En cas d'erreur, mettre une liste vide
      }
    };

    fetchLinkedUsers();
  }, [isOpen, eventId]);

  // Filtrer les utilisateurs pour ne pas afficher l'utilisateur courant
  const filteredUsers = useMemo(
    () => users.filter((user) => user.id !== currentUserId),
    [users, currentUserId]
  );

  const handleAddUser = async (userId: string) => {
    if (userId === currentUserId) {
      alert("Impossible de vous ajouter vous-même à l'événement.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/events/${eventId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur ajout utilisateur");
      }

      // Mettre à jour la liste des utilisateurs liés
      setLinkedUserIds((prev) => [...prev, userId]);

      alert("Utilisateur ajouté à l'événement !");
    } catch (e) {
      setError((e as Error).message);
      alert(`Erreur : ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
        <button
          onClick={onClose}
          aria-label="Fermer la fenêtre"
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
        >
          ×
        </button>
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          Partager l’événement : {eventTitle}
        </h2>

        {loading && <p>Chargement...</p>}
        {error && <p className="text-red-500">Erreur : {error}</p>}

        {!loading && !error && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-gray-600">Aucun utilisateur trouvé.</p>
            ) : (
              filteredUsers.map((user) => {
                const isLinked = linkedUserIds.includes(user.id);

                return (
                  <div
                    key={user.id}
                    className="flex justify-between items-center border p-2 rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {`${user.firstName} ${user.lastName}` || "Nom inconnu"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.email || "Email inconnu"}
                      </p>
                    </div>
                    {isLinked ? (
                      <span className="text-green-600 text-xl">✅</span>
                    ) : (
                      <button
                        onClick={() => handleAddUser(user.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
