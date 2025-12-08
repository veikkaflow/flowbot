
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../services/firebase.ts';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'flowbot_theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [userUid, setUserUid] = useState<string | null>(null);

    // 1. Initialize from LocalStorage immediately
    useEffect(() => {
        const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme;
        if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
            setThemeState(storedTheme);
            applyTheme(storedTheme);
        } else {
            applyTheme('dark');
        }
    }, []);

    // 2. Listen for Auth Changes and sync from DB
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserUid(user.uid);
                try {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        if (data.theme && (data.theme === 'dark' || data.theme === 'light')) {
                            // Database preference overrides local storage
                            setThemeState(data.theme);
                            localStorage.setItem(STORAGE_KEY, data.theme);
                            applyTheme(data.theme);
                        }
                    } else {
                        // Create the user document if it doesn't exist
                        const currentLocal = localStorage.getItem(STORAGE_KEY) as Theme || 'dark';
                        await setDoc(userRef, { theme: currentLocal }, { merge: true });
                        applyTheme(currentLocal);
                    }
                } catch (error) {
                    console.error("Error fetching/creating user theme preference:", error);
                }
            } else {
                setUserUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const applyTheme = (newTheme: Theme) => {
        const root = document.documentElement;
        if (newTheme === 'light') {
            root.classList.remove('theme-dark');
            root.classList.add('theme-light');
        } else {
            root.classList.remove('theme-light');
            root.classList.add('theme-dark');
        }
    };

    const setTheme = async (newTheme: Theme) => {
        // 1. Update State
        setThemeState(newTheme);
        
        // 2. Apply theme to DOM
        applyTheme(newTheme);
        
        // 3. Update LocalStorage
        localStorage.setItem(STORAGE_KEY, newTheme);

        // 4. Update Firestore (if logged in)
        if (userUid) {
            try {
                const userRef = doc(db, 'users', userUid);
                await setDoc(userRef, { theme: newTheme }, { merge: true });
            } catch (error) {
                console.error("Error saving theme preference to DB:", error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
