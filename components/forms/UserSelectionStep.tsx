"use client";

import React, { useState, useEffect } from "react";

type User = {
  id: string;
  name?: string;
  email?: string;
};

type UserSelectionStepProps = {
  title: string;
  subtitle: string;
  currentUserId: string;
  selectedUserIds: string[];
  onUserToggle: (userId: string) => void;
};

export const UserSelectionStep = ({
  title,
  subtitle,
  currentUserId,
  selectedUserIds,
  onUserToggle,
}: UserSelectionStepProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState("");

  // Charger tous les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/users');
        if (!res.ok) {
          throw new Error("Impossible de récupérer les utilisateurs");
        }
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filtrer les utilisateurs (exclure l'utilisateur actuel et appliquer la recherche)
  const filteredUsers = users.filter((user) => {
    // Exclure l'utilisateur actuel
    if (user.id === currentUserId) return false;
    
    // Si pas de recherche, afficher tous les autres utilisateurs
    if (!searchEmail.trim()) return true;
    
    // Filtrer par email ou nom (insensible à la casse)
    const searchTerm = searchEmail.toLowerCase().trim();
    const emailMatch = user.email?.toLowerCase().includes(searchTerm);
    const nameMatch = user.name?.toLowerCase().includes(searchTerm);
    
    return emailMatch || nameMatch;
  });

  const handleImportUser = () => {
    // Fonctionnalité d'import à implémenter plus tard
    alert("Fonctionnalité d'import à venir");
  };

  if (loading) {
    return (
      <div className="w-full">
        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">{title}</h1>
        <p>Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h1 className="text-h1 mb-4 text-left w-full font-urbanist">{title}</h1>
        <p className="text-red-500">Erreur: {error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-h1 mb-4 text-left w-full font-urbanist">{title}</h1>
      <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
        {subtitle}
      </h3>

      {/* Label indicateur de sélection - COMMENTÉ */}
      {/* <div className="mb-6">
        <span className="inline-block px-3 py-1 bg-[var(--color-validate)] text-white text-sm font-poppins rounded-full">
          {selectedUserIds.length} utilisateur{selectedUserIds.length !== 1 ? 's' : ''} sélectionné{selectedUserIds.length !== 1 ? 's' : ''}
        </span>
      </div> */}

      {/* Section de recherche */}
      <div className="mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block mb-2 text-body-large font-poppins text-[var(--color-grey-three)]">
              Rechercher par email
            </label>
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full px-4 py-3 text-base border-2 border-[var(--color-grey-two)] rounded placeholder:font-poppins placeholder:text-[#EAEAEF]"
            />
          </div>
          <button
            onClick={handleImportUser}
            className="px-6 py-3 bg-[var(--color-main)] text-white rounded hover:opacity-90 transition flex items-center gap-2 font-poppins"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Importer
          </button>
        </div>
      </div>

      {/* Liste des utilisateurs avec scrollbar personnalisée */}
      <div className="w-full">
        <div className="max-h-80 overflow-y-auto pr-2 space-y-3 custom-orange-scrollbar">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Aucun utilisateur trouvé.</p>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  className="flex justify-between items-center p-4 border-2 border-[var(--color-grey-two)] rounded-lg hover:border-[var(--color-main)] transition-all cursor-pointer"
                  onClick={() => onUserToggle(user.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium font-poppins text-[var(--color-text)]">
                      {user.name || "Nom inconnu"}
                    </p>
                    <p className="text-sm text-[var(--color-grey-three)] font-poppins">
                      {user.email || "Email inconnu"}
                    </p>
                  </div>
                  
                  {/* Checkbox stylisée */}
                  <div className="ml-4">
                    <div
                      className={`w-6 h-6 border-2 rounded transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-[var(--color-main)] border-[var(--color-main)]'
                          : 'border-[var(--color-grey-two)] hover:border-[var(--color-main)]'
                      }`}
                    >
                      {isSelected && (
                        <svg 
                          className="w-4 h-4 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M6 18L18 6M6 6l12 12" 
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Indicateur de sélection */}
      {/* {selectedUserIds.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-700 font-poppins">
            {selectedUserIds.length} utilisateur{selectedUserIds.length > 1 ? 's' : ''} sélectionné{selectedUserIds.length > 1 ? 's' : ''}
          </p>
        </div>
      )} */}
    </div>
  );
};
