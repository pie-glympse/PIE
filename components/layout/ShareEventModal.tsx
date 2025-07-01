"use client";

import React from "react";

type ShareEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  users: {
    id: string;
    name?: string;
    email?: string;
  }[];
};

// ...import React, useState, useEffect etc.

export const ShareEventModal = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: ShareEventModalProps) => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    fetch("/api/users")
      .then((res) => res.ok ? res.json() : Promise.reject("Erreur chargement users"))
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [isOpen]);

  console.log("shareModal", eventId);

  // Fonction pour ajouter un user à l'événement
  const handleAddUser = async (userId: string) => {
  try {
    const res = await fetch(`/api/events/${eventId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Erreur ajout user");
    }
    alert("Utilisateur ajouté à l'événement !");
  } catch (e) {
    alert(`Erreur : ${(e as Error).message}`);
  }
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold">×</button>
        <h2 className="text-xl font-bold mb-4">Partager l’événement : {eventTitle}</h2>

        {loading && <p>Chargement des utilisateurs...</p>}
        {error && <p className="text-red-500">Erreur : {error}</p>}

        {!loading && !error && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {users.length === 0 && <p className="text-gray-600">Aucun utilisateur trouvé.</p>}
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center border p-2 rounded">
                <div>
                  <p className="font-medium">{user.name || "Nom inconnu"}</p>
                  <p className="text-sm text-gray-500">{user.email || "Email inconnu"}</p>
                </div>
                <button
                  onClick={() => handleAddUser(user.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
