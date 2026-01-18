"use client";  

import { useState } from "react";
import { useTeamsData, type User, type Team } from "./hooks/useTeamsData";
import { TeamsSidebar } from "./components/TeamsSidebar";
import { TeamHeader } from "./components/TeamHeader";
import { UserList } from "./components/UserList";
import { CreateTeamModal } from "./components/CreateTeamModal";
import { AddUserModal } from "./components/AddUserModal";
import {
  createTeam,
  deleteTeam as deleteTeamApi,
  addUsersToTeam,
  removeUsersFromTeam,
  fetchTeams,

  fetchUsers
} from "./services/teamsApi";

const CreateGroupsPage = () => {
  const { users, setUsers, teams, setTeams, companyName, fetchError, isLoading, user } = useTeamsData();
  
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isDeletingTeam, setIsDeletingTeam] = useState<string | null>(null);
  const [isRemovingUsersFromTeam, setIsRemovingUsersFromTeam] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [selectedUsersForDeletion, setSelectedUsersForDeletion] = useState<Set<string>>(new Set());
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isAddingUsers, setIsAddingUsers] = useState(false);

  const isAdmin = user?.role === "ADMIN";

  const handleDeleteTeam = async (teamId: string) => {
    if (!isAdmin || !user?.companyId) return;
    
    setIsDeletingTeam(teamId);
    try {
      await deleteTeamApi(teamId);
      setTeams(prev => prev.filter(team => team.id !== teamId));
      
      if (selectedTeam && selectedTeam.id === teamId) {
        setSelectedTeam(null);
        setSelectedUsersForDeletion(new Set());
      }

      const usersData = await fetchUsers(user.companyId);
      setUsers(usersData);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsDeletingTeam(null);
    }
  };

  const handleRemoveUsersFromTeam = async (teamId: string, userIds: string[]) => {
    if (!isAdmin || userIds.length === 0 || !user?.companyId) return;
    
    setIsRemovingUsersFromTeam(teamId);
    try {
      await removeUsersFromTeam(teamId, userIds);
      
      const teamsData = await fetchTeams(user.companyId);
      setTeams(teamsData);
      
      if (selectedTeam && selectedTeam.id === teamId) {
        const updatedTeam = teamsData.find((t: Team) => t.id === teamId);
        setSelectedTeam(updatedTeam || null);
      }

      const usersData = await fetchUsers(user.companyId);
      setUsers(usersData);
      setSelectedUsersForDeletion(new Set());
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsRemovingUsersFromTeam(null);
    }
  };

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

  const handleCreateTeam = async (teamName: string, userIds: string[]) => {
    if (!user?.companyId) return;
    
    setIsCreatingTeam(true);
    try {
      const teamData = await createTeam(teamName, user.companyId, userIds);
      setTeams(prev => [teamData, ...prev]);
      setSelectedTeam(teamData);
      setShowCreateTeamModal(false);
      
      const usersData = await fetchUsers(user.companyId);
      setUsers(usersData);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleDeleteSelectedUsers = async () => {
    if (!isAdmin || !selectedTeam || selectedUsersForDeletion.size === 0) return;
    const userIds = Array.from(selectedUsersForDeletion);
    await handleRemoveUsersFromTeam(selectedTeam.id, userIds);
  };

  const handleAddUsers = async (userIds: string[]) => {
    if (!isAdmin || !selectedTeam || !user?.companyId) return;
    
    setIsAddingUsers(true);
    try {
      await addUsersToTeam(selectedTeam.id, userIds);
      
      const teamsData = await fetchTeams(user.companyId);
      setTeams(teamsData);
      const updatedTeam = teamsData.find((t: Team) => t.id === selectedTeam.id);
      setSelectedTeam(updatedTeam || null);

      const usersData = await fetchUsers(user.companyId);
      setUsers(usersData);
      setShowAddUserModal(false);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsAddingUsers(false);
    }
  };

  const handleSelectAll = (users: User[]) => {
    const allUserIds = new Set(users.map(user => user.id));
    setSelectedUsersForDeletion(allUserIds);
  };

  const handleDeselectAll = () => {
    setSelectedUsersForDeletion(new Set());
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    return <div>Vous devez être connecté pour accéder à cette page.</div>;
  }

  if (!user.companyId) {
    return <div>Vous n&apos;êtes pas associé à une entreprise.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex fixed top-22 left-0 right-0 bottom-0">
        <TeamsSidebar
          teams={teams}
          selectedTeam={selectedTeam}
          onTeamSelect={handleTeamSelect}
          onCreateTeam={() => setShowCreateTeamModal(true)}
          companyName={companyName}
          isAdmin={isAdmin}
        />

        {/* Zone principale */}
        <div className="flex-1 flex flex-col p-10">
          {selectedTeam ? (
            <>
              <TeamHeader
                team={selectedTeam}
                selectedUsersCount={selectedUsersForDeletion.size}
                onDeleteTeam={() => handleDeleteTeam(selectedTeam.id)}
                onDeleteUsers={handleDeleteSelectedUsers}
                isAdmin={isAdmin}
                isDeletingTeam={isDeletingTeam === selectedTeam.id}
                isRemovingUsers={isRemovingUsersFromTeam === selectedTeam.id}
              />

              <div className="flex-1 relative">
                <UserList
                  team={selectedTeam}
                  selectedUsers={selectedUsersForDeletion}
                  onUserToggle={handleUserToggleForDeletion}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  isAdmin={isAdmin}
                />
                
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

      <CreateTeamModal
        isOpen={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onConfirm={handleCreateTeam}
        users={users}
        isCreating={isCreatingTeam}
      />

      {selectedTeam && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onConfirm={handleAddUsers}
          users={users}
          teamName={selectedTeam.name}
          isAdding={isAddingUsers}
        />
      )}

      {fetchError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-red-800">{fetchError}</p>
        </div>
      )}
    </div>
  );
};

export default CreateGroupsPage;
