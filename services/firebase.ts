import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwj6ozTFznKg8ojHI76pBgyQ2bHOPUivM",
  authDomain: "flowbot-ai-927a9.firebaseapp.com",
  projectId: "flowbot-ai-927a9",
  storageBucket: "flowbot-ai-927a9.firebasestorage.app",
  messagingSenderId: "867354428321",
  appId: "1:867354428321:web:de3d36576b1c2cea2281e0",
  measurementId: "G-WDEG22LJ68"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
