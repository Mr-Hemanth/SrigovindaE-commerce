# ✨ Sri Govinda Collections - E-Commerce App

A complete jewellery e-commerce application built with React, Firebase, and Tailwind CSS.

## 🛍️ Features

### For Customers
1. 🛡️ Authentication - Signup/Login with Firebase Auth
2. 📦 Product Browsing - 3 main categories (German Silver, One Gram Gold, Panchaloha) with subcategories
3. 🔍 Advanced Filtering/Sorting - Filter by category, subcategory, price, sort by price
4. ❤️ Wishlist - Save items for later
5. 🛒 Shopping Cart - Add/remove/update quantities, Apply Instagram coupons!
6. 💳 Checkout - Multiple payment options (Card, UPI, COD)
7. 👤 Profile Management - Update user details

### For Admins
1. 📊 Dashboard - Overview of products, orders, users, coupons
2. 🛠️ Product Management - Add, edit, delete jewelry items
3. 📦 Order Management - View and update order statuses
4. 🎟️ Coupon Management - Create discount codes for Instagram followers!

## 🎨 Elegant Design

- Premium brown/gold color scheme perfect for jewelry store
- Playfair Display & Poppins Google Fonts
- Beautiful animations and transitions
- Responsive design for all devices

## 🛠️ Tech Stack

- Frontend: React 18 + React Router + Tailwind CSS
- Backend: Firebase (Authentication + Firestore Database)
- Styling: Tailwind CSS

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
cd /Users/apple/Desktop/E-Commerce
npm install
```

### Step 2: Set Up Firebase (IMPORTANT!)

This is required for signup/login to work!

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add Project** and follow the steps
3. Once project is created, **Enable Email/Password Authentication**:
   - In left sidebar → **Authentication** → **Sign-in method**
   - Enable **Email/Password** → Save
4. Create **Firestore Database**:
   - Left sidebar → **Firestore Database** → **Create Database**
   - Choose **Start in Test Mode** → Next
   - Choose location → Enable
5. Register a **Web App**:
   - Click the Settings (⚙️) → Project Settings → Scroll down → Your apps → Add app (</>)
   - Give a nickname → Check "Also set up Firebase Hosting" → Register app
   - Copy the firebaseConfig it gives you!
6. Update `src/firebase.js` with your real config!

### Step 3: Set Up Firestore Collections (Optional but Recommended)

You can add these collections manually, or let app create them automatically!

### Step 4: Create an Admin Account

1. Signup an account via app
2. Go back to Firebase Console → Firestore Database
3. Find your user document in `users` collection
4. Add a field named `isAdmin` and set to `true`

### Step 5: Run the App

```bash
npm start
```

Open http://localhost:3000 in your browser!

## 📦 Building for Production

```bash
npm run build
```

## 📝 Notes

- Remember to update Firestore security rules before launching to production
- App uses sample product data initially, replace with your actual inventory via admin panel!
- Consider adding Firebase Storage for product images!

Enjoy your Sri Govinda Collections e-commerce app! 🛍️✨
