
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations, Language } from '../data/translations.ts';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../services/firebase.ts';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'flowbot_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('fi');
    const [userUid, setUserUid] = useState<string | null>(null);

    // 1. Initialize from LocalStorage immediately
    useEffect(() => {
        const storedLang = localStorage.getItem(STORAGE_KEY) as Language;
        if (storedLang && (storedLang === 'fi' || storedLang === 'en')) {
            setLanguageState(storedLang);
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
                        if (data.language && (data.language === 'fi' || data.language === 'en')) {
                            // Database preference overrides local storage
                            setLanguageState(data.language);
                            localStorage.setItem(STORAGE_KEY, data.language);
                        }
                    } else {
                        // FIX: Create the user document if it doesn't exist. 
                        // This ensures the 'users' collection is created in Firestore immediately on login.
                        const currentLocal = localStorage.getItem(STORAGE_KEY) as Language || 'fi';
                        await setDoc(userRef, { language: currentLocal }, { merge: true });
                    }
                } catch (error) {
                    console.error("Error fetching/creating user language preference:", error);
                }
            } else {
                setUserUid(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const setLanguage = async (lang: Language) => {
        // 1. Update State
        setLanguageState(lang);
        
        // 2. Update LocalStorage
        localStorage.setItem(STORAGE_KEY, lang);

        // 3. Update Firestore (if logged in)
        if (userUid) {
            try {
                const userRef = doc(db, 'users', userUid);
                // Use setDoc with merge: true to create the document if it doesn't exist,
                // or update just the language field if it does.
                await setDoc(userRef, { language: lang }, { merge: true });
            } catch (error) {
                console.error("Error saving language preference to DB:", error);
            }
        }
    };

    const t = (key: string): string => {
        const keys = translations[language] as Record<string, string>;
        return keys[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
