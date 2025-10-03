"use client";  

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  teamId?: string;
}

interface Team {
  id: string;
  name: string;
  users: User[];
  company: {
    name: string;
  };
  createdAt?: string;
}

const CreateGroupsPage = () => {
  const { user, isLoading, setUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState<string | null>(null);
  const [isRemovingUsersFromTeam, setIsRemovingUsersFromTeam] = useState<string | null>(null);
  
  // Nouveaux états pour la refonte
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [selectedUsersForNewTeam, setSelectedUsersForNewTeam] = useState<Set<string>>(new Set());
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [selectedUsersForDeletion, setSelectedUsersForDeletion] = useState<Set<string>>(new Set());
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<Set<string>>(new Set());
  const [isAddingUsers, setIsAddingUsers] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  // Fonction utilitaire pour formater les dates
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

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

  // Effet pour récupérer les teams de la company
  useEffect(() => {
    if (!isLoading && user && user.companyId) {
      fetch(`/api/teams?companyId=${user.companyId}`)
        .then((res) => {
          if (!res.ok)
            throw new Error("Erreur lors de la récupération des teams");
          return res.json();
        })
        .then((data) => {
          setTeams(data);
        })
        .catch((err) => {
          console.error("Erreur récupération teams:", err);
        });
    }
  }, [isLoading, user?.companyId, user]);


  const handleDeleteTeam = async (teamId: string) => {
    if (!isAdmin) return;
    
    setIsDeletingTeam(teamId);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression de la team");
      }

      // Retirer la team de la liste
      setTeams(prev => prev.filter(team => team.id !== teamId));
      
      // Si la team supprimée était sélectionnée, la désélectionner
      if (selectedTeam && selectedTeam.id === teamId) {
        setSelectedTeam(null);
        setSelectedUsersForDeletion(new Set());
      }

      // Rafraîchir la liste des utilisateurs pour mettre à jour leur teamId
      const usersRes = await fetch(`/api/users?companyId=${user?.companyId}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      
    } catch (error) {
      console.error("Erreur:", error);
      setFetchError("Erreur lors de la suppression de la team");
    } finally {
      setIsDeletingTeam(null);
    }
  };


  const handleRemoveUsersFromTeam = async (teamId: string, userIds: string[]) => {
    if (!isAdmin || userIds.length === 0) return;
    
    setIsRemovingUsersFromTeam(teamId);
    try {
      const response = await fetch(`/api/teams/${teamId}/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du retrait des utilisateurs");
      }

      // Rafraîchir les données
      const teamsRes = await fetch(`/api/teams?companyId=${user?.companyId}`);
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
        // Mettre à jour la team sélectionnée si c'est celle-ci
        if (selectedTeam && selectedTeam.id === teamId) {
          const updatedTeam = teamsData.find((t: Team) => t.id === teamId);
          setSelectedTeam(updatedTeam || null);
        }
      }

      const usersRes = await fetch(`/api/users?companyId=${user?.companyId}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      
      // Réinitialiser la sélection
      setSelectedUsersForDeletion(new Set());
      
    } catch (error) {
      console.error("Erreur:", error);
      setFetchError("Erreur lors du retrait des utilisateurs");
    } finally {
      setIsRemovingUsersFromTeam(null);
    }
  };

  // Nouvelles fonctions pour la refonte
  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setSelectedUsersForDeletion(new Set());
  };

  const handleUserToggleForDeletion = (userId: string) => {
    if (!isAdmin) return;
    
    const newSelected = new Set(selectedUsersForDeletion);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsersForDeletion(newSelected);
  };

  const handleUserToggleForNewTeam = (userId: string) => {
    if (!isAdmin) return;
    
    const newSelected = new Set(selectedUsersForNewTeam);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsersForNewTeam(newSelected);
  };

  const handleCreateTeamFromModal = async () => {
    if (!isAdmin || selectedUsersForNewTeam.size === 0 || !newTeamName.trim()) return;
    
    setIsCreatingTeam(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeamName,
          companyId: user?.companyId ? String(user.companyId) : null,
          userIds: Array.from(selectedUsersForNewTeam)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de la team");
      }

      const teamData = await response.json();
      
      // Ajouter la nouvelle team à la liste
      setTeams(prev => [teamData, ...prev]);
      
      // Sélectionner automatiquement la nouvelle team
      setSelectedTeam(teamData);
      
      // Fermer la modal et réinitialiser
      setShowCreateTeamModal(false);
      setSelectedUsersForNewTeam(new Set());
      setNewTeamName('');
      
      // Rafraîchir les utilisateurs
      const usersRes = await fetch(`/api/users?companyId=${user?.companyId}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      
    } catch (error) {
      console.error("Erreur:", error);
      setFetchError("Erreur lors de la création de la team");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleDeleteSelectedUsers = async () => {
    if (!isAdmin || !selectedTeam || selectedUsersForDeletion.size === 0) return;
    
    const userIds = Array.from(selectedUsersForDeletion);
    await handleRemoveUsersFromTeam(selectedTeam.id, userIds);
  };

  const handleUserToggleForAdding = (userId: string) => {
    if (!isAdmin) return;
    
    const newSelected = new Set(selectedUsersToAdd);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsersToAdd(newSelected);
  };

  const handleAddUsersToExistingTeam = async () => {
    if (!isAdmin || !selectedTeam || selectedUsersToAdd.size === 0) return;
    
    setIsAddingUsers(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds: Array.from(selectedUsersToAdd) })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'ajout des utilisateurs");
      }

      // Rafraîchir les données
      const teamsRes = await fetch(`/api/teams?companyId=${user?.companyId}`);
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
        // Mettre à jour la team sélectionnée
        const updatedTeam = teamsData.find((t: Team) => t.id === selectedTeam.id);
        setSelectedTeam(updatedTeam || null);
      }

      const usersRes = await fetch(`/api/users?companyId=${user?.companyId}`);
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fermer la modal et réinitialiser
      setShowAddUserModal(false);
      setSelectedUsersToAdd(new Set());
      
    } catch (error) {
      console.error("Erreur:", error);
      setFetchError("Erreur lors de l'ajout des utilisateurs");
    } finally {
      setIsAddingUsers(false);
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen pt-24">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* Header avec nom de l'entreprise */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">
              {companyName || "Mon Entreprise"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Gestion des équipes</p>
          </div>

          {/* Liste des teams */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`p-3 rounded-lg transition-all ${
                    selectedTeam?.id === team.id
                      ? 'bg-[var(--color-secondary)] text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div 
                      onClick={() => handleTeamSelect(team)}
                      className="flex-1 cursor-pointer"
                    >
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-xs opacity-75">
                        {team.users.length} utilisateur{team.users.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bouton créer une team */}
          {isAdmin && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="w-full bg-[var(--color-secondary)] text-white py-3 px-4 rounded-lg hover:opacity-90 transition font-medium"
              >
                + Créer une équipe
              </button>
            </div>
          )}
        </div>

        {/* Zone principale */}
        <div className="flex-1 flex flex-col">
          {selectedTeam ? (
            <>
              {/* Header de la team sélectionnée */}
              <div className="bg-gray-50 p-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 items-baseline">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedTeam.name}</h2>
                    <p className="text-gray-600">
                      - {selectedTeam.users.length} utilisateur{selectedTeam.users.length !== 1 ? 's' : ''} dans cette équipe
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-3">
                      {selectedUsersForDeletion.size > 0 && (
                        <button
                          onClick={handleDeleteSelectedUsers}
                          disabled={isRemovingUsersFromTeam === selectedTeam.id}
                          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                        >
                          {isRemovingUsersFromTeam === selectedTeam.id ? "Suppression..." : `Supprimer utilisateurs (${selectedUsersForDeletion.size})`}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTeam(selectedTeam.id)}
                        disabled={isDeletingTeam === selectedTeam.id}
                        className="bg-white border border-gray-700 text-black px-4 py-2 rounded-lg hover:bg-black hover:text-white disabled:opacity-50 transition"
                      >
                        {isDeletingTeam === selectedTeam.id ? "Suppression..." : "Supprimer équipe"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Liste des utilisateurs de la team */}
              <div className="flex-1 relative">
                {selectedTeam.users.length > 0 ? (
                  <div className="bg-white">
                    {/* En-tête du tableau */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <div className="flex items-center">
                        {isAdmin && (
                          <div className="w-8 flex justify-center">
                            <input
                              type="checkbox"
                              checked={selectedTeam.users.length > 0 && selectedTeam.users.every(user => selectedUsersForDeletion.has(user.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const allUserIds = new Set(selectedTeam.users.map(user => user.id));
                                  setSelectedUsersForDeletion(allUserIds);
                                } else {
                                  setSelectedUsersForDeletion(new Set());
                                }
                              }}
                              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                          </div>
                        )}
                        <div className="flex-1 grid grid-cols-3 gap-4">
                          <div className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Nom</div>
                          <div className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Email</div>
                          <div className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Date d&apos;ajout</div>
                        </div>
                      </div>
                    </div>

                    {/* Corps du tableau */}
                    <div className="divide-y divide-gray-200">
                      {selectedTeam.users.map((user) => (
                        <div
                          key={user.id}
                          className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                            selectedUsersForDeletion.has(user.id) ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center">
                            {isAdmin && (
                              <div className="w-8 flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={selectedUsersForDeletion.has(user.id)}
                                  onChange={() => handleUserToggleForDeletion(user.id)}
                                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                              </div>
                            )}
                            <div className="flex-1 grid grid-cols-3 gap-4">
                              <div className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-gray-600">
                                {user.email}
                              </div>
                              <div className="text-gray-500 text-sm">
                                {selectedTeam.createdAt ? formatDate(selectedTeam.createdAt) : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">Aucun utilisateur dans cette équipe</p>
                  </div>
                )}
                
                {/* Bouton + pour ajouter des utilisateurs */}
                {isAdmin && (
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="fixed bottom-6 right-6 bg-[var(--color-secondary)] text-white w-12 h-12 rounded-full shadow-lg hover:opacity-90 transition flex items-center justify-center text-xl font-bold"
                  >
                    +
                  </button>
                )}
              </div>
            </>
          ) : (
            /* État vide - aucune team sélectionnée */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  Sélectionnez une équipe {isAdmin ? 'ou créez en une' : ''}
                </h3>
                <p className="text-gray-500">
                  Choisissez une équipe pour voir ses membres
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de création de team */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Créer une nouvelle équipe</h2>
              <p className="text-gray-600 mt-1">Sélectionnez les utilisateurs à ajouter à cette équipe</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l&apos;équipe
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Nom de l'équipe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utilisateurs disponibles ({users.filter(u => !u.teamId).length})
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                    {users.filter(u => !u.teamId).map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center space-x-3 p-2 rounded ${
                          selectedUsersForNewTeam.has(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsersForNewTeam.has(user.id)}
                          onChange={() => handleUserToggleForNewTeam(user.id)}
                          className="w-4 h-4 text-[var(--color-main)] border-gray-300 rounded focus:ring-[var(--color-main)]"
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    ))}
                    {users.filter(u => !u.teamId).length === 0 && (
                      <p className="text-gray-500 text-center py-4">Tous les utilisateurs sont déjà assignés à une équipe</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateTeamModal(false);
                  setSelectedUsersForNewTeam(new Set());
                  setNewTeamName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateTeamFromModal}
                disabled={isCreatingTeam || selectedUsersForNewTeam.size === 0 || !newTeamName.trim()}
                className="bg-[var(--color-main)] text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isCreatingTeam ? "Création..." : "Créer l'équipe"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout d'utilisateurs à une équipe existante */}
      {showAddUserModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Ajouter un nouveau membre</h2>
              <p className="text-gray-600 mt-1">Sélectionnez les utilisateurs à ajouter à l&apos;équipe &quot;{selectedTeam.name}&quot;</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utilisateurs disponibles ({users.filter(u => !u.teamId).length})
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                  {users.filter(u => !u.teamId).map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-2 rounded ${
                        selectedUsersToAdd.has(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsersToAdd.has(user.id)}
                        onChange={() => handleUserToggleForAdding(user.id)}
                        className="w-4 h-4 text-[var(--color-main)] border-gray-300 rounded focus:ring-[var(--color-main)]"
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => !u.teamId).length === 0 && (
                    <p className="text-gray-500 text-center py-4">Tous les utilisateurs sont déjà assignés à une équipe</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSelectedUsersToAdd(new Set());
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleAddUsersToExistingTeam}
                disabled={isAddingUsers || selectedUsersToAdd.size === 0}
                className="bg-[var(--color-main)] text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isAddingUsers ? "Ajout..." : `Ajouter (${selectedUsersToAdd.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {fetchError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-red-800">{fetchError}</p>
        </div>
      )}
    </div>
  );
};

export default CreateGroupsPage;
