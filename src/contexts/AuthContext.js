import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendEmailVerification, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function signup(email, password, name, phone) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send email verification link
    await sendEmailVerification(userCredential.user);
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      phone: phone || '',
      isAdmin: false,
      createdAt: new Date()
    });
    return userCredential;
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        name: user.displayName || 'Customer',
        email: user.email,
        phone: '', // Google login doesn't have phone, must complete profile
        isAdmin: false,
        createdAt: new Date()
      });
    }
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          setCurrentUser({ ...user, ...userData });
          setIsAdmin(userData.isAdmin || false);
        } catch (err) {
          console.warn('Failed to retrieve user profile from Firestore (offline):', err);
          setCurrentUser({ 
            uid: user.uid, 
            email: user.email, 
            name: user.displayName || 'Customer', 
            offline: true 
          });
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    signup,
    login,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
