import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../services/firebase.ts';
import { User } from '../types.ts';
import { useUserContext } from '../context/UserContext.tsx';

export const useUserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useUserContext();

    // Get current user's role
    const getCurrentUserRole = async (): Promise<'superadmin' | 'admin' | 'agent' | 'viewer' | null> => {
        if (!currentUser?.uid) return null;
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                return data.role || 'agent';
            }
        } catch (error) {
            console.error('Error getting user role:', error);
        }
        return null;
    };

    // Check if current user is admin or superadmin
    const isAdmin = async (): Promise<boolean> => {
        const role = await getCurrentUserRole();
        return role === 'admin' || role === 'superadmin';
    };
    
    // Check if current user is superadmin
    const isSuperAdmin = async (): Promise<boolean> => {
        const role = await getCurrentUserRole();
        return role === 'superadmin';
    };

    // Load all users (only admins can see all users)
    useEffect(() => {
        const loadUsers = async () => {
            if (!currentUser?.uid) {
                setLoading(false);
                return;
            }

            try {
                const userRole = await getCurrentUserRole();
                if (userRole === 'admin' || userRole === 'superadmin') {
                    const usersSnapshot = await getDocs(collection(db, 'users'));
                    const usersList: User[] = [];
                    usersSnapshot.forEach((docSnap) => {
                        const data = docSnap.data();
                        const allowedBotIds = data.allowedBotIds || [];
                        console.log(`User ${data.email}: allowedBotIds =`, allowedBotIds);
                        usersList.push({
                            uid: docSnap.id,
                            email: data.email || '',
                            role: data.role || 'agent',
                            name: data.name || data.email?.split('@')[0] || '',
                            allowedBotIds: allowedBotIds,
                        });
                    });
                    setUsers(usersList);
                } else {
                    // Non-admin users only see themselves
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUsers([{
                            uid: currentUser.uid,
                            email: data.email || currentUser.email || '',
                            role: data.role || 'agent',
                            name: data.name || currentUser.email?.split('@')[0] || '',
                            allowedBotIds: data.allowedBotIds || [],
                        }]);
                    }
                }
            } catch (error) {
                console.error('Error loading users:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUsers();
    }, [currentUser?.uid]);

    const addUser = async (email: string, role: 'superadmin' | 'admin' | 'agent' | 'viewer', password?: string) => {
        const userRole = await getCurrentUserRole();
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            throw new Error('Vain admin-käyttäjät voivat lisätä käyttäjiä');
        }

        // Tarkista että superadmin-roolia voi luoda vain superadmin
        if (role === 'superadmin' && userRole !== 'superadmin') {
            throw new Error('Vain superadmin-käyttäjät voivat luoda superadmin-käyttäjiä');
        }

        // Salasana on pakollinen
        if (!password || password.length < 6) {
            throw new Error('Salasanan on oltava vähintään 6 merkkiä pitkä');
        }

        try {
            // Käytä Firebase Functions createUser funktiota
            const createUserFunction = httpsCallable<{
                email: string;
                password: string;
                role: 'superadmin' | 'admin' | 'agent' | 'viewer';
                name?: string;
            }, {
                success: boolean;
                uid: string;
                email: string;
                role: string;
                name: string;
            }>(functions, 'createUser');

            const result = await createUserFunction({
                email,
                password,
                role,
                name: email.split('@')[0],
            });

            if (!result.data.success) {
                throw new Error('Käyttäjän luonti epäonnistui');
            }

            const newUser: User = {
                uid: result.data.uid,
                email: result.data.email,
                role: result.data.role as User['role'],
                name: result.data.name,
                allowedBotIds: [],
            };

            // Optimistisesti lisää uusi käyttäjä listaan heti
            setUsers(prevUsers => {
                // Tarkista ettei käyttäjä ole jo listassa
                if (prevUsers.find(u => u.uid === newUser.uid)) {
                    return prevUsers;
                }
                return [...prevUsers, newUser];
            });

            // Päivitä lista Firestoresta varmistaaksemme että kaikki on synkassa
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersList: User[] = [];
                usersSnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    usersList.push({
                        uid: docSnap.id,
                        email: data.email || '',
                        role: data.role || 'agent',
                        name: data.name || data.email?.split('@')[0] || '',
                        allowedBotIds: data.allowedBotIds || [],
                    });
                });
                setUsers(usersList);
            } catch (refreshError) {
                console.error('Error refreshing users list:', refreshError);
                // Jos päivitys epäonnistuu, lista on jo päivitetty optimistisesti
            }

            return newUser;
        } catch (error: any) {
            console.error('Error adding user:', error);
            
            // Muunna Firebase Functions virheet selkeämmiksi viesteiksi
            if (error.code === 'permission-denied') {
                throw new Error('Sinulla ei ole oikeuksia luoda käyttäjiä');
            } else if (error.code === 'already-exists') {
                throw new Error('Käyttäjä tällä sähköpostilla on jo olemassa');
            } else if (error.code === 'invalid-argument') {
                throw new Error(error.message || 'Virheelliset tiedot');
            } else if (error.message) {
                throw new Error(error.message);
            }
            
            throw error;
        }
    };
    
    const updateUser = async (updatedUser: User) => {
        const userRole = await getCurrentUserRole();
        if (userRole !== 'admin' && userRole !== 'superadmin' && updatedUser.uid !== currentUser?.uid) {
            throw new Error('Vain admin-käyttäjät voivat muokata muita käyttäjiä');
        }

        // Check if trying to change superadmin role - only superadmin can do this
        const targetUserDoc = await getDoc(doc(db, 'users', updatedUser.uid));
        if (targetUserDoc.exists()) {
            const targetUserData = targetUserDoc.data();
            const isChangingToSuperAdmin = updatedUser.role === 'superadmin' && targetUserData.role !== 'superadmin';
            const isChangingFromSuperAdmin = targetUserData.role === 'superadmin' && updatedUser.role !== 'superadmin';
            
            if ((isChangingToSuperAdmin || isChangingFromSuperAdmin) && userRole !== 'superadmin') {
                throw new Error('Vain superadmin-käyttäjät voivat muuttaa superadmin-roolia');
            }
        }

        try {
            const userData = {
                email: updatedUser.email,
                role: updatedUser.role,
                name: updatedUser.name,
                allowedBotIds: updatedUser.allowedBotIds || [],
            };
            
            console.log('Updating user:', updatedUser.uid, userData);
            
            await setDoc(doc(db, 'users', updatedUser.uid), userData, { merge: true });

            // Refresh users list by reloading from Firestore
            const userRoleAfter = await getCurrentUserRole();
            if (userRoleAfter === 'admin' || userRoleAfter === 'superadmin') {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersList: User[] = [];
                usersSnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    usersList.push({
                        uid: docSnap.id,
                        email: data.email || '',
                        role: data.role || 'agent',
                        name: data.name || data.email?.split('@')[0] || '',
                        allowedBotIds: data.allowedBotIds || [],
                    });
                });
                setUsers(usersList);
            } else {
                // For non-admin, just update the local state
                setUsers(prev => prev.map(u => u.uid === updatedUser.uid ? updatedUser : u));
            }
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    };
    
    const deleteUser = async (uid: string) => {
        const userRole = await getCurrentUserRole();
        if (userRole !== 'admin' && userRole !== 'superadmin') {
            throw new Error('Vain admin-käyttäjät voivat poistaa käyttäjiä');
        }

        if (uid === currentUser?.uid) {
            throw new Error('Et voi poistaa omaa käyttäjätiliäsi');
        }

        // Check if target user is superadmin - only superadmin can delete superadmin
        const targetUserDoc = await getDoc(doc(db, 'users', uid));
        if (targetUserDoc.exists()) {
            const targetUserData = targetUserDoc.data();
            if (targetUserData.role === 'superadmin' && userRole !== 'superadmin') {
                throw new Error('Vain superadmin-käyttäjät voivat poistaa superadmin-käyttäjiä');
            }
        }

        try {
            await deleteDoc(doc(db, 'users', uid));
            
            // Refresh users list
            setUsers(prev => prev.filter(u => u.uid !== uid));
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    };

    return {
        users,
        loading,
        addUser,
        updateUser,
        deleteUser,
        getCurrentUserRole,
        isAdmin,
        isSuperAdmin,
    };
};
