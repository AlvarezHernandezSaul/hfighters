// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClKnSCadbu86oChh5Nettsfh27yhUJjpU",
  authDomain: "housefighters-e6c99.firebaseapp.com",
  projectId: "housefighters-e6c99",
  storageBucket: "housefighters-e6c99.firebasestorage.app",
  messagingSenderId: "1041706264230",
  appId: "1:1041706264230:web:aff4caac8de437305db667"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const realtimeDb = getDatabase(app); // Inicializar Realtime Database
const functions = getFunctions(app);

export { auth, realtimeDb, functions };