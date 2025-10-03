"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type Team = {
  id: string;
  name: string;
  users: User[];
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
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [companyName, setCompanyName] = useState<string>("");
  const [isCompanySelected, setIsCompanySelected] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  // Charger les utilisateurs de la company
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.companyId) {
        setError("Vous n'êtes pas associé à une company");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Récupérer le nom de la company
        const companyRes = await fetch(`/api/company?userId=${user.id}`);
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompanyName(companyData.companyName);
        }

        // Récupérer les utilisateurs de la company
        const usersRes = await fetch(`/api/users?companyId=${user.companyId}`);
        if (!usersRes.ok) {
          throw new Error("Impossible de récupérer les utilisateurs de la company");
        }
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Récupérer les teams de la company
        const teamsRes = await fetch(`/api/teams?companyId=${user.companyId}`);
        if (teamsRes.ok) {
          const teamsData = await teamsRes.json();
          setTeams(teamsData);
        }
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user?.companyId, user?.id]);

  // Filtrer les utilisateurs (exclure l'utilisateur actuel et appliquer la recherche)
  const filteredUsers = users.filter((user) => {
    // Exclure l'utilisateur actuel
    if (user.id === currentUserId) return false;
    
    // Si pas de recherche, afficher tous les autres utilisateurs
    if (!searchEmail.trim()) return true;
    
    // Filtrer par email ou nom (insensible à la casse)
    const searchTerm = searchEmail.toLowerCase().trim();
    const emailMatch = user.email?.toLowerCase().includes(searchTerm);
    const firstNameMatch = user.firstName?.toLowerCase().includes(searchTerm);
    const lastNameMatch = user.lastName?.toLowerCase().includes(searchTerm);

    return emailMatch || firstNameMatch || lastNameMatch;
  });

  const handleImportUser = () => {
    // Fonctionnalité d'import à implémenter plus tard
    alert("Fonctionnalité d'import à venir");
  };

  // Gérer la sélection/désélection de toute la company
  const handleCompanyToggle = () => {
    if (isCompanySelected) {
      // Désélectionner tous les utilisateurs de la company
      filteredUsers.forEach(user => {
        if (selectedUserIds.includes(user.id)) {
          onUserToggle(user.id);
        }
      });
      // Désélectionner toutes les teams
      setSelectedTeams(new Set());
    } else {
      // Sélectionner tous les utilisateurs de la company
      filteredUsers.forEach(user => {
        if (!selectedUserIds.includes(user.id)) {
          onUserToggle(user.id);
        }
      });
      // Sélectionner toutes les teams
      const allTeamIds = new Set(teams.map(team => team.id));
      setSelectedTeams(allTeamIds);
    }
    setIsCompanySelected(!isCompanySelected);
  };

  // Gérer la sélection/désélection d'une team
  const handleTeamToggle = (teamId: string) => {
    const newSelectedTeams = new Set(selectedTeams);
    const team = teams.find(t => t.id === teamId);
    
    if (!team) return;

    if (newSelectedTeams.has(teamId)) {
      // Désélectionner la team
      newSelectedTeams.delete(teamId);
      // Désélectionner tous les utilisateurs de cette team
      team.users.forEach(user => {
        if (selectedUserIds.includes(user.id)) {
          onUserToggle(user.id);
        }
      });
    } else {
      // Sélectionner la team
      newSelectedTeams.add(teamId);
      // Sélectionner tous les utilisateurs de cette team
      team.users.forEach(user => {
        if (!selectedUserIds.includes(user.id)) {
          onUserToggle(user.id);
        }
      });
    }
    
    setSelectedTeams(newSelectedTeams);
  };

  // Vérifier si tous les utilisateurs de la company sont sélectionnés
  useEffect(() => {
    if (filteredUsers.length > 0) {
      const allSelected = filteredUsers.every(user => selectedUserIds.includes(user.id));
      setIsCompanySelected(allSelected);
    }
  }, [selectedUserIds, filteredUsers]);

  // Vérifier si toutes les teams sont sélectionnées
  useEffect(() => {
    if (teams.length > 0) {
      const allTeamsSelected = teams.every(team => {
        const teamUserIds = team.users.map(user => user.id);
        return teamUserIds.every(id => selectedUserIds.includes(id));
      });
      
      if (allTeamsSelected) {
        const allTeamIds = new Set(teams.map(team => team.id));
        setSelectedTeams(allTeamIds);
      }
    }
  }, [selectedUserIds, teams]);

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

      {/* Section de sélection de la company */}
      {companyName && (
        <div className="mb-6 p-4 border-2 border-[var(--color-grey-two)] rounded-lg hover:border-[var(--color-tertiary)] transition-all">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={handleCompanyToggle}
          >
            <div className="flex-1">
              <p className="font-semibold font-poppins text-[var(--color-text)] text-lg">
                {companyName}
              </p>
              <p className="text-sm text-[var(--color-grey-three)] font-poppins">
                Sélectionner tous les utilisateurs de votre entreprise
              </p>
            </div>
            
            {/* Checkbox pour la company */}
            <div className="ml-4">
              <div
                className={`w-6 h-6 border-2 rounded transition-all flex items-center justify-center ${
                  isCompanySelected
                    ? 'bg-[var(--color-main)] border-[var(--color-main)]'
                    : 'border-[var(--color-grey-two)] hover:border-[var(--color-main)]'
                }`}
              >
                {isCompanySelected && (
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
        </div>
      )}

      {/* Section des teams */}
      {teams.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold font-poppins text-[var(--color-text)] mb-3">
            Teams
          </h3>
          <div className="space-y-2">
            {teams.map((team) => (
              <div 
                key={team.id}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTeams.has(team.id) 
                    ? 'bg-green-50 border-green-200' 
                    : 'border-gray-200 hover:border-[var(--color-main)]'
                }`}
                onClick={() => handleTeamToggle(team.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium font-poppins text-[var(--color-text)]">
                      {team.name}
                    </p>
                    <p className="text-sm text-[var(--color-grey-three)] font-poppins">
                      {team.users.length} utilisateur(s)
                    </p>
                  </div>
                  
                  {/* Checkbox pour la team */}
                  <div className="ml-4">
                    <div
                      className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                        selectedTeams.has(team.id)
                          ? 'bg-[var(--color-main)] border-[var(--color-main)]'
                          : 'border-[var(--color-grey-two)] hover:border-[var(--color-main)]'
                      }`}
                    >
                      {selectedTeams.has(team.id) && (
                        <svg 
                          className="w-3 h-3 text-white" 
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
              </div>
            ))}
          </div>
        </div>
      )}

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
                      {`${user.firstName} ${user.lastName}` || "Nom inconnu"}
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
