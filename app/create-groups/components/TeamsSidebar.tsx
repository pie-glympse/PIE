import { Team } from '../hooks/useTeamsData';

interface TeamsSidebarProps {
  teams: Team[];
  selectedTeam: Team | null;
  onTeamSelect: (team: Team) => void;
  onCreateTeam: () => void;
  companyName: string;
  isAdmin: boolean;
}

export const TeamsSidebar = ({ teams, selectedTeam, onTeamSelect, onCreateTeam, companyName, isAdmin }: TeamsSidebarProps) => {
  return (
    <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Header */}
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
                  onClick={() => onTeamSelect(team)}
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
            onClick={onCreateTeam}
            className="w-full bg-[var(--color-secondary)] text-white py-3 px-4 rounded-lg hover:opacity-90 transition font-medium"
          >
            + Créer une équipe
          </button>
        </div>
      )}
    </div>
  );
};

