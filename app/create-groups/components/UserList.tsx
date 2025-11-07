'use client';
import { Team, User } from '../hooks/useTeamsData';

interface UserListProps {
  team: Team;
  selectedUsers: Set<string>;
  onUserToggle: (userId: string) => void;
  onSelectAll: (users: User[]) => void;
  onDeselectAll: () => void;
  isAdmin: boolean;
}

const formatDate = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const UserList = ({ team, selectedUsers, onUserToggle, onSelectAll, onDeselectAll, isAdmin }: UserListProps) => {
  const allSelected = team.users.length > 0 && team.users.every(user => selectedUsers.has(user.id));

  if (team.users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Aucun utilisateur dans cette équipe</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* En-tête du tableau */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center">
          {isAdmin && (
            <div className="w-8 flex justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelectAll(team.users);
                  } else {
                    onDeselectAll();
                  }
                }}
                className="w-4 h-4 text-[var(--color-main)] border-gray-300 rounded focus:ring-[var(--color-main)]"
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
        {team.users.map((user) => (
          <div
            key={user.id}
            onClick={() => onUserToggle(user.id)}
            className={`px-6 py-4 cursor-pointer transition-colors ${
              selectedUsers.has(user.id) ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              {isAdmin && (
                <div className="w-8 flex justify-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onUserToggle(user.id)}
                    className="w-4 h-4 text-[var(--color-main)] border-gray-300 rounded focus:ring-[var(--color-main)]"
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
                  {team.createdAt ? formatDate(team.createdAt) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

