// src/config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Values taken from google-services.json (project_info + client_info).
// Not read from that file at runtime: the JS SDK wants its own config
// object, separate from what the native plugin uses at Android build time.
//
// apiKey: prefer the EXPO_PUBLIC_FIREBASE_API_KEY env var (set on EAS).
// Fallback hardcoded: this is Firebase's public web API key, not a secret
// (it identifies the project, it does not authorize access). Keep the
// fallback so a missing env var cannot crash the app at module load —
// an empty apiKey made initializeAuth throw auth/invalid-api-key in v1.8.0.
const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyDoCJqDqjpya39Fj8cnjXeAmzZu12GgluU',
  authDomain: 'lifeos-93904.firebaseapp.com',
  projectId: 'lifeos-93904',
  storageBucket: 'lifeos-93904.firebasestorage.app',
  messagingSenderId: '611050453713',
  appId: '1:611050453713:android:181b38571ccae8656323f0',
};

// Defense in depth: surface a clear signal if the key is ever missing or
// malformed, instead of a silent auth error later.
if (!firebaseConfig.apiKey) {
  console.error('[firebase] apiKey is empty - check EXPO_PUBLIC_FIREBASE_API_KEY');
}

// getApps().length avoids "Firebase App named '[DEFAULT]' already exists"
// if Fast Refresh reloads this module more than once during development.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth (not getAuth) with getReactNativePersistence is
// mandatory here: without it, the session lives in memory only and is
// gone the moment the app closes, with no error to flag it.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
