import React, { useState } from 'react';
import { Lock, Mail } from './Icons.tsx';
import { BrandLogo } from './Icons.tsx';
import { auth, db } from '../services/firebase.ts';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginScreenProps {
  logoUrl: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ logoUrl }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLoginView && password !== confirmPassword) {
      setError('Salasanat eivät täsmää.');
      return;
    }
    
    setIsLoading(true);

    if (isLoginView) {
      // Login logic
      signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
          console.error("Login error:", error);
          if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            setError('Sähköposti tai salasana on virheellinen.');
          } else {
            setError('Kirjautuminen epäonnistui. Yritä uudelleen.');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Sign-up logic
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          // Käyttäjä luotiin onnistuneesti Firebase Authiin
          const user = userCredential.user;
          
          // Luo täysi käyttäjädokumentti Firestoreen
          try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            // Varmista että dokumentti ei ole jo olemassa
            if (!userDoc.exists()) {
              await setDoc(userRef, {
                email: email,
                role: 'agent', // Oletusrooli uusille käyttäjille
                name: email.split('@')[0], // Nimi sähköpostin ensimmäisestä osasta
                allowedBotIds: [],
              });
              console.log('Käyttäjädokumentti luotu Firestoreen');
            }
          } catch (error) {
            console.error('Virhe käyttäjädokumentin luomisessa:', error);
            // Älä keskeytä kirjautumista vaikka dokumentin luonti epäonnistuisi
          }
        })
        .catch((error) => {
          console.error("Signup error:", error);
          if (error.code === 'auth/email-already-in-use') {
            setError('Sähköposti on jo käytössä.');
          } else if (error.code === 'auth/weak-password') {
            setError('Salasanan on oltava vähintään 6 merkkiä pitkä.');
          } else {
            setError('Tilin luonti epäonnistui. Yritä uudelleen.');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#141414]">
      <div className="w-full max-w-sm mx-auto p-8 bg-black bg-opacity-20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 animate-float">
            <BrandLogo className="w-full h-full text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">{isLoginView ? 'FlowBot AI' : 'Luo tili'}</h1>
          <p className="text-gray-400 mt-2">{isLoginView ? 'Kirjaudu hallintapaneeliin' : 'Aloita luomalla uusi tili'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Sähköposti
            </label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sähköposti"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Salasana
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLoginView ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Salasana"
              />
            </div>
          </div>
          {!isLoginView && (
            <div>
              <label htmlFor="confirm-password" className="sr-only">Vahvista salasana</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Vahvista salasana"
                />
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {isLoading ? (isLoginView ? 'Kirjaudutaan...' : 'Luodaan tiliä...') : (isLoginView ? 'Kirjaudu sisään' : 'Luo tili')}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <button onClick={toggleView} className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
            {isLoginView ? 'Eikö sinulla ole tiliä? Luo tili' : 'Onko sinulla jo tili? Kirjaudu sisään'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;