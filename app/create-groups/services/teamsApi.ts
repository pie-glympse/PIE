import { Team, User } from '../hooks/useTeamsData';

export const createTeam = async (name: string, companyId: string, userIds: string[]): Promise<Team> => {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, companyId, userIds })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Erreur lors de la création de la team");
  }

  return response.json();
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  const response = await fetch(`/api/teams/${teamId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Erreur lors de la suppression de la team");
  }
};

export const addUsersToTeam = async (teamId: string, userIds: string[]): Promise<void> => {
  const response = await fetch(`/api/teams/${teamId}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Erreur lors de l'ajout des utilisateurs");
  }
};

export const removeUsersFromTeam = async (teamId: string, userIds: string[]): Promise<void> => {
  const response = await fetch(`/api/teams/${teamId}/users`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userIds })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Erreur lors du retrait des utilisateurs");
  }
};

export const fetchTeams = async (companyId: string): Promise<Team[]> => {
  const response = await fetch(`/api/teams?companyId=${companyId}`);
  
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des teams");
  }
  
  return response.json();
};

export const fetchUsers = async (companyId: string): Promise<User[]> => {
  const response = await fetch(`/api/users?companyId=${companyId}`);
  
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des utilisateurs");
  }
  
  return response.json();
};

