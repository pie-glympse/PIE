"use client";  

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";

interface User {
  id: string;
  firstName?: string;
  email?: string;
}

const CreateGroupsPage = () => {
  const { user, isLoading, setUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamName, setTeamName] = useState<string>('');
  const [showTeamForm, setShowTeamForm] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!isLoading && user && !user.companyId) {
      // Récupérer les données utilisateur complètes pour avoir le companyId
      fetch(`/api/users/${user.id}`)
        .then((res) => {
          if (!res.ok)
            throw new Error("Erreur lors de la récupération des données utilisateur");
          return res.json();
        })
        .then((userData) => {
          // Mettre à jour l'utilisateur avec les données complètes
          const updatedUser = { ...user, companyId: userData.companyId?.toString() };
          setUser(updatedUser);
          // Mettre à jour le localStorage aussi
          localStorage.setItem('user', JSON.stringify(updatedUser));
        })
        .catch((err) => setFetchError(err.message));
    }
  }, [isLoading, user, setUser]);

  // Effet pour récupérer le nom de la company
  useEffect(() => {
    if (!isLoading && user && user.id) {
      fetch(`/api/company?userId=${user.id}`)
        .then((res) => {
          if (!res.ok)
            throw new Error("Erreur lors de la récupération des données de la company");
          return res.json();
        })
        .then((data) => {
          setCompanyName(data.companyName);
        })
        .catch((err) => {
          console.error("Erreur récupération company:", err);
          setCompanyName("Company");
        });
    }
  }, [isLoading, user?.id, user]);

  // Effet séparé pour récupérer les utilisateurs de la company
  useEffect(() => {
    if (!isLoading && user && user.companyId) {
      fetch(`/api/users?companyId=${user.companyId}`)
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
  }, [isLoading, user?.companyId, user]);

  const handleUserToggle = (userId: string) => {
    if (!isAdmin) return;
    
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleConfirmRemoval = async () => {
    if (!isAdmin || selectedUsers.size === 0) return;
    
    setIsRemoving(true);
    try {
      const response = await fetch('/api/users/remove-from-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers)
        })
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression des utilisateurs");
      }

      // Mettre à jour la liste des utilisateurs
      setUsers(users.filter(u => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      
    } catch (error) {
      console.error("Erreur:", error);
      setFetchError("Erreur lors de la suppression des utilisateurs");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!isAdmin || selectedUsers.size === 0 || !teamName.trim()) return;
    
    setIsCreatingTeam(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamName,
          companyId: user?.companyId ? String(user.companyId) : null,
          userIds: Array.from(selectedUsers)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de la team");
      }

      const teamData = await response.json();
      
      // Mettre à jour la liste des utilisateurs (retirer ceux assignés à la team)
      setUsers(users.filter(u => !selectedUsers.has(u.id)));
      setSelectedUsers(new Set());
      setTeamName('');
      setShowTeamForm(false);
      
      alert(`Team "${teamData.name}" créée avec succès avec ${teamData.users.length} utilisateur(s) !`);
      
    } catch (error) {
      console.error("Erreur:", error);
      setFetchError("Erreur lors de la création de la team");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <div>Vous devez être connecté pour accéder à cette page.</div>;
  }

  if (!user.companyId) {
    return <div>Vous n&apos;êtes pas associé à une company.</div>;
  }

  return (
    <div className="mt-30 p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isAdmin ? `Gestion des utilisateurs de ${companyName || "la company"}` : `Utilisateurs au sein de ${companyName || "votre company"}`}
      </h1>
      
      {isAdmin && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Mode administrateur : Vous pouvez sélectionner des utilisateurs pour les retirer de la company.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {users.map((u) => (
          <div 
            key={u.id} 
            className={`p-4 border rounded-lg flex items-center justify-between ${
              isAdmin && selectedUsers.has(u.id) 
                ? 'bg-red-50 border-red-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <input
                  type="checkbox"
                  checked={selectedUsers.has(u.id)}
                  onChange={() => handleUserToggle(u.id)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
              )}
              <div>
                <span className="font-medium">{u.firstName || 'Nom non renseigné'}</span>
                <span className="text-gray-500 ml-2">- {u.email}</span>
              </div>
            </div>
            {isAdmin && selectedUsers.has(u.id) && (
              <span className="text-red-600 text-sm font-medium">Sélectionné pour suppression</span>
            )}
          </div>
        ))}
      </div>

      {isAdmin && selectedUsers.size > 0 && (
        <div className="mt-6 space-y-4">
          {/* Section création de team */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 mb-4">
              {selectedUsers.size} utilisateur(s) sélectionné(s) - Créer une team
            </p>
            
            {!showTeamForm ? (
              <button
                onClick={() => setShowTeamForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Créer une team avec ces utilisateurs
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Nom de la team"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTeam}
                    disabled={isCreatingTeam || !teamName.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingTeam ? "Création..." : "Créer la team"}
                  </button>
                  <button
                    onClick={() => {
                      setShowTeamForm(false);
                      setTeamName('');
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section suppression de la company */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 mb-4">
              Ou retirer ces utilisateurs de la company
            </p>
            <button
              onClick={handleConfirmRemoval}
              disabled={isRemoving}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRemoving ? "Suppression en cours..." : "Retirer de la company"}
            </button>
          </div>
        </div>
      )}

      {fetchError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{fetchError}</p>
        </div>
      )}
    </div>
  );
};

export default CreateGroupsPage;
