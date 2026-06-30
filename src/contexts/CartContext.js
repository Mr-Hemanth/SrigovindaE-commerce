import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchCart = async () => {
      if (currentUser) {
        try {
          const cartDoc = await getDoc(doc(db, 'carts', currentUser.uid));
          if (cartDoc.exists()) {
            const items = cartDoc.data().items || [];
            setCart(items);
            localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(items));
          } else {
            setCart([]);
          }
        } catch (err) {
          console.warn('Firestore fetchCart offline. Loading from localStorage:', err);
          const cached = localStorage.getItem(`cart_${currentUser.uid}`);
          if (cached) {
            setCart(JSON.parse(cached));
          }
        }
      } else {
        setCart([]);
      }
    };
    fetchCart();
  }, [currentUser]);

  const addToCart = async (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    if (existingItem) {
      newCart = cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(newCart);
    if (currentUser) {
      localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(newCart));
      try {
        await setDoc(doc(db, 'carts', currentUser.uid), { items: newCart }, { merge: true });
      } catch (err) {
        console.warn('Firestore addToCart offline. Saved locally:', err);
      }
    }
  };

  const removeFromCart = async (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    if (currentUser) {
      localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(newCart));
      try {
        await setDoc(doc(db, 'carts', currentUser.uid), { items: newCart });
      } catch (err) {
        console.warn('Firestore removeFromCart offline. Saved locally:', err);
      }
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map(item => 
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(newCart);
    if (currentUser) {
      localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(newCart));
      try {
        await setDoc(doc(db, 'carts', currentUser.uid), { items: newCart });
      } catch (err) {
        console.warn('Firestore updateQuantity offline. Saved locally:', err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    setCoupon(null);
    setDiscount(0);
    if (currentUser) {
      localStorage.removeItem(`cart_${currentUser.uid}`);
      try {
        await setDoc(doc(db, 'carts', currentUser.uid), { items: [] });
      } catch (err) {
        console.warn('Firestore clearCart offline. Reset locally:', err);
      }
    }
  };

  const applyCoupon = async (couponCode) => {
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const couponDoc = snap.docs[0];
        const couponData = couponDoc.data();
        const now = new Date();
        const expiryDate = couponData.expiryDate.toDate ? couponData.expiryDate.toDate() : new Date(couponData.expiryDate);
        if (now <= expiryDate) {
          setCoupon(couponData);
          setDiscount(couponData.discountPercentage);
          return { success: true, message: 'Coupon applied successfully!' };
        }
        return { success: false, message: 'Coupon has expired!' };
      }
      return { success: false, message: 'Invalid coupon code!' };
    } catch (err) {
      console.warn('Coupon verification offline:', err);
      return { success: false, message: 'Could not verify coupon because you are offline.' };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
  };

  const subtotal = cart.reduce((total, item) => {
    const activePrice = item.discountedPrice !== undefined && item.discountedPrice !== null && item.discountedPrice !== '' && Number(item.discountedPrice) > 0
      ? Number(item.discountedPrice)
      : Number(item.price);
    return total + (activePrice * item.quantity);
  }, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    coupon,
    discount,
    subtotal,
    discountAmount,
    total
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
