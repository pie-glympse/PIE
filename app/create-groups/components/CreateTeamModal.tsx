'use client';

import { useState } from 'react';
import { User } from '../hooks/useTeamsData';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (teamName: string, userIds: string[]) => Promise<void>;
  users: User[];
  isCreating: boolean;
}

export const CreateTeamModal = ({ isOpen, onClose, onConfirm, users, isCreating }: CreateTeamModalProps) => {
  const [teamName, setTeamName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const availableUsers = users.filter(u => !u.teamId);
  
  const filteredUsers = availableUsers.filter(u => 
    (u.firstName || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.lastName || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleConfirm = async () => {
    if (teamName.trim() && selectedUsers.size > 0) {
      await onConfirm(teamName, Array.from(selectedUsers));
      setTeamName('');
      setSelectedUsers(new Set());
      setSearch('');
    }
  };

  const handleClose = () => {
    setTeamName('');
    setSelectedUsers(new Set());
    setSearch('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 h-[80vh] flex flex-col">
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
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Nom de l'équipe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher un utilisateur (nom, email)
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-main)]"
              />
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utilisateurs disponibles ({filteredUsers.length})
              </label>
              <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center space-x-3 p-2 rounded ${
                      selectedUsers.has(user.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleToggle(user.id)}
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
                {filteredUsers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Tous les utilisateurs sont déjà assignés à une équipe</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isCreating || selectedUsers.size === 0 || !teamName.trim()}
            className="bg-[var(--color-main)] text-white px-6 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isCreating ? "Création..." : "Créer l'équipe"}
          </button>
        </div>
      </div>
    </div>
  );
};

