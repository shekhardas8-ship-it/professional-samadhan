// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length && firebaseConfig?.apiKey ? initializeApp(firebaseConfig) : (getApps().length ? getApp() : null);
export const auth = app ? getAuth(app) : null;
export const googleAuthProvider = new GoogleAuthProvider();
