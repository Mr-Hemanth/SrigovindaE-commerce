import 'server-only';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function loadServiceAccount() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_BASE64 is not set. Generate a service account key from ' +
      'Firebase Console > Project Settings > Service Accounts, base64-encode the JSON, and set it in .env.local.'
    );
  }
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
}

// Lazy singleton: only touches env vars / initializes the Admin SDK the first time a route
// handler actually calls adminDb()/adminAuth() at request time — never at module import time.
// This matters because Next.js imports every app/api/**/route.js during `next build` to collect
// route metadata, which would otherwise throw when .env.local doesn't exist yet (e.g. in CI or a
// fresh checkout before secrets are configured).
function getAdminApp() {
  return getApps().length ? getApps()[0] : initializeApp({ credential: cert(loadServiceAccount()) });
}

export function adminDb() {
  return getFirestore(getAdminApp());
}

export function adminAuth() {
  return getAuth(getAdminApp());
}
