import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCwa7ox10mMn1FRcCpxzgfc89pWtzGZUJw",
  authDomain: "gen-lang-client-0746010330.firebaseapp.com",
  projectId: "gen-lang-client-0746010330",
  storageBucket: "gen-lang-client-0746010330.firebasestorage.app",
  messagingSenderId: "652665487825",
  appId: "1:652665487825:web:879a99a6c30693e295e0f0",
  measurementId: "G-D76QTFQH01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
