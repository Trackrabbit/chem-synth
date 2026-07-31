import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC9-p5CHbJXPgm6NoE73GfGriS2AtQXl0c",
  authDomain: "chemsynth-69a02.firebaseapp.com",
  projectId: "chemsynth-69a02",
  storageBucket: "chemsynth-69a02.firebasestorage.app",
  messagingSenderId: "335289034476",
  appId: "1:335289034476:web:af0c06f388b0f93f00e7c9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);