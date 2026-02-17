"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import Image from "next/image";

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoUrl?: string;
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

  // Charger les utilisateurs de l'entreprise
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.companyId) {
        setError("Vous n'êtes pas associé à une entreprise");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Récupérer le nom de l'entreprise
        const companyRes = await fetch(`/api/company?userId=${user.id}`);
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompanyName(companyData.companyName);
        }

        // Récupérer les utilisateurs de l'entreprise
        const usersRes = await fetch(`/api/users?companyId=${user.companyId}`);
        if (!usersRes.ok) {
          throw new Error("Impossible de récupérer les utilisateurs de l'entreprise");
        }
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Récupérer les équipes de l'entreprise
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

  // Gérer la sélection/désélection de toute l'entreprise
  const handleCompanyToggle = () => {
    if (isCompanySelected) {
      // Désélectionner tous les utilisateurs de l'entreprise
      filteredUsers.forEach(user => {
        if (selectedUserIds.includes(user.id)) {
          onUserToggle(user.id);
        }
      });
      // Désélectionner toutes les équipes
      setSelectedTeams(new Set());
    } else {
      // Sélectionner tous les utilisateurs de l'entreprise
      filteredUsers.forEach(user => {
        if (!selectedUserIds.includes(user.id)) {
          onUserToggle(user.id);
        }
      });
      // Sélectionner toutes les équipes
      const allTeamIds = new Set(teams.map(team => team.id));
      setSelectedTeams(allTeamIds);
    }
    setIsCompanySelected(!isCompanySelected);
  };

  // Gérer la sélection/désélection d'une équipe
  const handleTeamToggle = (teamId: string) => {
    const newSelectedTeams = new Set(selectedTeams);
    const team = teams.find(t => t.id === teamId);

    if (!team) return;

    if (newSelectedTeams.has(teamId)) {
      // Désélectionner l'équipe
      newSelectedTeams.delete(teamId);
      // Désélectionner tous les utilisateurs de cette équipe
      team.users.forEach(user => {
        if (selectedUserIds.includes(user.id)) {
          onUserToggle(user.id);
        }
      });
    } else {
      // Sélectionner l'équipe
      newSelectedTeams.add(teamId);
      // Sélectionner tous les utilisateurs de cette équipe
      team.users.forEach(user => {
        if (!selectedUserIds.includes(user.id)) {
          onUserToggle(user.id);
        }
      });
    }

    setSelectedTeams(newSelectedTeams);
  };

  // Vérifier si tous les utilisateurs de l'entreprise sont sélectionnés
  useEffect(() => {
    if (filteredUsers.length > 0) {
      const allSelected = filteredUsers.every(user => selectedUserIds.includes(user.id));
      setIsCompanySelected(allSelected);
    }
  }, [selectedUserIds, filteredUsers]);

  // Vérifier si toutes les équipes sont sélectionnées
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
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-h1 text-left w-full font-urbanist">{title}</h1>
      </div>
      <h3 className="text-h3 mb-8 text-left md:w-2/3 w-full font-poppins text-[var(--color-grey-three)]">
        {subtitle}
      </h3>
      {companyName && (
          <div className="flex items-center gap-4">
              <p className="font-semibold font-poppins text-[var(--color-text)] text-base">
                Amenez tout le monde !
              </p>
            <button
              type="button"
              onClick={handleCompanyToggle}
              aria-pressed={isCompanySelected}
              className={`relative inline-flex h-7 min-w-14 items-center rounded-full transition-colors ${
                isCompanySelected ? 'bg-[var(--color-secondary)]' : 'bg-[var(--color-grey-two)]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isCompanySelected ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      {/* Label indicateur de sélection - COMMENTÉ */}
      {/* <div className="mb-6">
        <span className="inline-block px-3 py-1 bg-[var(--color-validate)] text-white text-sm font-poppins rounded-full">
          {selectedUserIds.length} utilisateur{selectedUserIds.length !== 1 ? 's' : ''} sélectionné{selectedUserIds.length !== 1 ? 's' : ''}
        </span>
      </div> */}

      {/* L'ancienne section entreprise est remplacée par le switch dans l'entête */}

      {/* Section des équipes */}
      {teams.length > 0 && (
        <div className="my-6">
          <h3 className="text-lg font-semibold font-poppins text-[var(--color-text)] mb-3">
            Équipes
          </h3>
          <div className="flex flex-wrap gap-3">
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => handleTeamToggle(team.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 border-2 rounded-lg w-fit transition-all font-poppins ${
                  selectedTeams.has(team.id)
                    ? 'bg-[var(--color-main)] border-[var(--color-main)] text-white'
                    : 'border-[var(--color-grey-two)] text-[var(--color-text)] hover:border-[var(--color-main)]'
                }`}
              >
                <span className="text-md font-medium">{team.name}</span>
                <span className={`text-xs ${selectedTeams.has(team.id) ? 'text-white/90' : 'text-[var(--color-grey-three)]'}`}>
                  {team.users.length} utilisateur(s)
                </span>
              </button>
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
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 flex-shrink-0">
                      {user.photoUrl && user.photoUrl.trim() !== '' ? (
                        <Image
                          src={user.photoUrl}
                          alt={`Photo de profil de ${user.firstName} ${user.lastName}`}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                          sizes="48px"
                          quality={75}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium font-poppins text-[var(--color-text)]">
                        {`${user.firstName} ${user.lastName}` || "Nom inconnu"}
                      </p>
                      <p className="text-sm text-[var(--color-grey-three)] font-poppins">
                        {user.email || "Email inconnu"}
                      </p>
                    </div>
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
