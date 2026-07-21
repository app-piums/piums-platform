import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase is browser-only: during `next build` (SSR/prerender) the
// NEXT_PUBLIC_FIREBASE_* vars may be absent and getAuth() would crash the build.
const isBrowser = typeof window !== 'undefined';

const app: FirebaseApp | null = isBrowser
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : null;

const auth = (app ? getAuth(app) : null) as Auth;
const googleProvider = new GoogleAuthProvider();

let messaging: Messaging | null = null;
if (app) {
  try {
    messaging = getMessaging(app);
  } catch {
    // Messaging not supported in this browser (e.g. Safari without permission)
  }
}

export { auth, googleProvider, messaging };
