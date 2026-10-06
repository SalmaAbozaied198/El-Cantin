import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Replace with your Firebase project credentials from Firebase Console -> Project Settings
export const firebaseConfig = {
  apiKey: "AIzaSyAKlpvUb7cQ2LuGLlZqNeCJC1LskfhvaiM",
  authDomain: "el-cantin.firebaseapp.com",
  projectId: "el-cantin",
  storageBucket: "el-cantin.firebasestorage.app",
  messagingSenderId: "145192010301",
  appId: "1:145192010301:web:47e2172f03a779adf62054"
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Determine if user has provided valid Firebase configuration
export const isFirebaseConfigured = (): boolean => {
  return (
    Boolean(firebaseConfig.apiKey) &&
    firebaseConfig.apiKey !== "YOUR_API_KEY"
  );
};

export const getFirebaseInstance = () => {
  if (!isFirebaseConfigured()) {
    return { app: null, auth: null, db: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db, isConfigured: true };
  } catch (error) {
    console.warn("Firebase initialization skipped or failed:", error);
    return { app: null, auth: null, db: null, isConfigured: false };
  }
};
