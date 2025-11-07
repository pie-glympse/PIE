'use client';

import { Team } from '../hooks/useTeamsData';
interface TeamHeaderProps {
  team: Team;
  selectedUsersCount: number;
  onDeleteTeam: () => void;
  onDeleteUsers: () => void;
  isAdmin: boolean;
  isDeletingTeam: boolean;
  isRemovingUsers: boolean;
}

export const TeamHeader = ({ 
  team, 
  selectedUsersCount, 
  onDeleteTeam, 
  onDeleteUsers, 
  isAdmin, 
  isDeletingTeam, 
  isRemovingUsers 
}: TeamHeaderProps) => {
  return (
    <div className="bg-gray-50 p-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-baseline">
          <h2 className="text-2xl font-bold text-gray-800">{team.name}</h2>
          <p className="text-gray-600">
            - {team.users.length} utilisateur{team.users.length !== 1 ? 's' : ''} dans cette équipe
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center space-x-3">
            {selectedUsersCount > 0 && (
              <button
                onClick={onDeleteUsers}
                disabled={isRemovingUsers}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
              >
                {isRemovingUsers ? "Suppression..." : `Supprimer utilisateurs (${selectedUsersCount})`}
              </button>
            )}
            <button
              onClick={onDeleteTeam}
              disabled={isDeletingTeam}
              className="bg-white border border-gray-700 text-black px-4 py-2 rounded-lg hover:bg-black hover:text-white disabled:opacity-50 transition"
            >
              {isDeletingTeam ? "Suppression..." : "Supprimer équipe"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

