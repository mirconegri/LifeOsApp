// src/config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Values taken from google-services.json (project_info + client_info).
// Not read from that file at runtime: the JS SDK wants its own config
// object, separate from what the native plugin uses at Android build time.
const firebaseConfig = {
  apiKey: 'AIzaSyDoCJqDqjpya39Fj8cnjXeAmzZu12GgluU',
  authDomain: 'lifeos-93904.firebaseapp.com',
  projectId: 'lifeos-93904',
  storageBucket: 'lifeos-93904.firebasestorage.app',
  messagingSenderId: '611050453713',
  appId: '1:611050453713:android:181b38571ccae8656323f0',
};

// getApps().length avoids "Firebase App named '[DEFAULT]' already exists"
// if Fast Refresh reloads this module more than once during development.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth (not getAuth) with getReactNativePersistence is
// mandatory here: without it, the session lives in memory only and is
// gone the moment the app closes, with no error to flag it.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
