// src/lib/firebase-admin.ts
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length && firebaseConfig?.projectId) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getApps().length ? getAuth() : null;
