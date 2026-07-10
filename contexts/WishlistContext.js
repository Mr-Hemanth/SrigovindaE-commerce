'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const WishlistContext = createContext();

export function useWishlist() {
  return useContext(WishlistContext);
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchWishlist = async () => {
      if (currentUser) {
        try {
          const wishlistDoc = await getDoc(doc(db, 'wishlists', currentUser.uid));
          if (wishlistDoc.exists()) {
            const items = wishlistDoc.data().items || [];
            setWishlist(items);
            localStorage.setItem(`wishlist_${currentUser.uid}`, JSON.stringify(items));
          }
        } catch (err) {
          console.warn('Firestore fetchWishlist offline. Loading from localStorage:', err);
          const cached = localStorage.getItem(`wishlist_${currentUser.uid}`);
          if (cached) {
            setWishlist(JSON.parse(cached));
          }
        }
      } else {
        setWishlist([]);
      }
    };
    fetchWishlist();
  }, [currentUser]);

  const toggleWishlist = async (product) => {
    const isInWishlist = wishlist.some(item => item.id === product.id);
    let newWishlist;
    if (isInWishlist) {
      newWishlist = wishlist.filter(item => item.id !== product.id);
    } else {
      newWishlist = [...wishlist, product];
    }
    setWishlist(newWishlist);
    if (currentUser) {
      localStorage.setItem(`wishlist_${currentUser.uid}`, JSON.stringify(newWishlist));
      try {
        await setDoc(doc(db, 'wishlists', currentUser.uid), { items: newWishlist }, { merge: true });
      } catch (err) {
        console.warn('Firestore toggleWishlist offline. Saved locally:', err);
      }
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const value = {
    wishlist,
    toggleWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
