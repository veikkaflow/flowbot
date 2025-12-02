import React from 'react';
import { useUserManagement } from '../hooks/useUserManagement.ts';
import { User } from '../types.ts';
import { Shield, Plus, Trash2 } from './Icons.tsx';

const UserManagementSettings: React.FC = () => {
    const { users, addUser, updateUser, deleteUser } = useUserManagement();

    const handleAddUser = () => {
        const email = prompt("Anna uuden käyttäjän sähköposti:");
        if (email) {
            addUser(email, 'agent'); // Default to agent role
        }
    };

    const handleRoleChange = (user: User, role: User['role']) => {
        updateUser({ ...user, role });
    };

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Shield className="w-6 h-6" /> Käyttäjähallinta</h3>

            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-white">Käyttäjät</h4>
                    <button onClick={handleAddUser} className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-md">
                        <Plus className="w-4 h-4"/> Lisää käyttäjä
                    </button>
                </div>
                <div className="space-y-3">
                    {users.map(user => (
                        <div key={user.uid} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                            <div>
                                <p className="font-medium text-white">{user.name}</p>
                                <p className="text-sm text-gray-400">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={user.role} 
                                    onChange={(e) => handleRoleChange(user, e.target.value as User['role'])}
                                    className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="agent">Agentti</option>
                                    <option value="viewer">Katselija</option>
                                </select>
                                <button onClick={() => deleteUser(user.uid)} className="p-2 text-gray-500 hover:text-red-400 rounded-full">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserManagementSettings;
