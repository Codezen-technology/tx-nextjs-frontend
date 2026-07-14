"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type AuthProvider,
} from "firebase/auth";
import { env } from "@/lib/env";

export type SocialProviderKey = "google" | "facebook" | "apple";

const ALL_PROVIDER_KEYS: SocialProviderKey[] = ["google", "facebook", "apple"];

/** Providers actually enabled in the Firebase Console, per `NEXT_PUBLIC_FIREBASE_ENABLED_PROVIDERS`. */
export const ENABLED_SOCIAL_PROVIDERS: SocialProviderKey[] = ALL_PROVIDER_KEYS.filter((key) =>
  env.FIREBASE_ENABLED_PROVIDERS.includes(key),
);

function firebaseConfig() {
  return {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
  };
}

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps()[0] ?? initializeApp(firebaseConfig());
  return app;
}

function providerFor(key: SocialProviderKey): AuthProvider {
  switch (key) {
    case "google":
      return new GoogleAuthProvider();
    case "facebook":
      return new FacebookAuthProvider();
    case "apple":
      return new OAuthProvider("apple.com");
  }
}

/**
 * Runs a Firebase sign-in popup for the given provider and returns the ID
 * token to send to `POST /auth/social`. Verification happens server-side
 * (see `FirebaseTokenVerifier` in wp-lms-backend-rest-api) — this only
 * collects the token, it does not trust anything client-side.
 */
export async function signInWithSocialProvider(key: SocialProviderKey): Promise<string> {
  if (!env.FIREBASE_API_KEY || !env.FIREBASE_PROJECT_ID) {
    throw new Error("Firebase is not configured (missing NEXT_PUBLIC_FIREBASE_* env vars).");
  }

  const auth = getAuth(getFirebaseApp());
  const result = await signInWithPopup(auth, providerFor(key));
  return result.user.getIdToken();
}
