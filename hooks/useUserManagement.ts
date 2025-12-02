import { useSettings } from './useSettings.ts';
import { User } from '../types.ts';

export const useUserManagement = () => {
    const { settings: userManagement, setSettings } = useSettings('userManagement');

    const addUser = (email: string, role: 'admin' | 'agent' | 'viewer') => {
        if (userManagement) {
            // This is a simplified version. A real implementation would involve
            // creating the user in Firebase Auth and then adding their details here.
            const newUser: User = {
                uid: `user_${Date.now()}`,
                email,
                role,
                name: email.split('@')[0], // Default name
            };
            setSettings({ ...userManagement, users: [...userManagement.users, newUser] });
        }
    };
    
    const updateUser = (updatedUser: User) => {
        if (userManagement) {
            const updatedUsers = userManagement.users.map(u => (u.uid === updatedUser.uid ? updatedUser : u));
            setSettings({ ...userManagement, users: updatedUsers });
        }
    };
    
    const deleteUser = (uid: string) => {
        if (userManagement) {
            const updatedUsers = userManagement.users.filter(u => u.uid !== uid);
            setSettings({ ...userManagement, users: updatedUsers });
        }
    };

    return {
        users: userManagement?.users || [],
        addUser,
        updateUser,
        deleteUser,
    };
};
