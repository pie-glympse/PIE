import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

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

export const useTeamsData = () => {
  const { user, isLoading } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Récupérer les données de l'utilisateur si nécessaire
  useEffect(() => {
    if (!isLoading && user && !user.companyId) {
      fetch(`/api/users/${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la récupération des données utilisateur");
          return res.json();
        })
        .then((userData) => {
          const updatedUser = { ...user, companyId: userData.companyId?.toString() };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        })
        .catch((err) => setFetchError(err.message));
    }
  }, [isLoading, user]);

  // Récupérer le nom de la company
  useEffect(() => {
    if (!isLoading && user && user.id) {
      fetch(`/api/company?userId=${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Erreur lors de la récupération des données de la company");
          return res.json();
        })
        .then((data) => setCompanyName(data.companyName))
        .catch(() => setCompanyName("Company"));
    }
  }, [isLoading, user?.id]);

  // Récupérer les utilisateurs de la company
  useEffect(() => {
    if (!isLoading && user && user.companyId) {
      fetch(`/api/users?companyId=${user.companyId}`)
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
  }, [isLoading, user?.companyId]);

  // Récupérer les teams de la company
  useEffect(() => {
    if (!isLoading && user && user.companyId) {
      console.log('[useTeamsData] Récupération des teams pour companyId:', user.companyId);
      fetch(`/api/teams?companyId=${user.companyId}`)
        .then((res) => {
          console.log('[useTeamsData] Response status:', res.status);
          if (!res.ok) throw new Error("Erreur lors de la récupération des teams");
          return res.json();
        })
        .then((data) => {
          console.log('[useTeamsData] Teams reçues:', data);
          console.log('[useTeamsData] Nombre de teams:', data.length);
          setTeams(data);
        })
        .catch((err) => {
          console.error("Erreur récupération teams:", err);
          setFetchError("Erreur lors du chargement des équipes");
        });
    }
  }, [isLoading, user?.companyId]);

  return {
    users,
    setUsers,
    teams,
    setTeams,
    companyName,
    fetchError,
    setFetchError,
    isLoading,
    user,
  };
};

export type { User, Team };

