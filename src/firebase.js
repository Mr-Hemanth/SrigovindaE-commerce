import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: REPLACE THIS WITH YOUR REAL FIREBASE CONFIG FROM FIREBASE CONSOLE!
const firebaseConfig = {
  apiKey: "AIzaSyA88jONRERydOnElGg3dXDE1zDSI2GGQ_E",
  authDomain: "sri-govinda-3e09d.firebaseapp.com",
  projectId: "sri-govinda-3e09d",
  storageBucket: "sri-govinda-3e09d.firebasestorage.app",
  messagingSenderId: "1029126487165",
  appId: "1:1029126487165:web:7fc122195fe72c2c2c8514",
  measurementId: "G-2FTCR596MF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable persistent offline caching for Firestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);
