// src/lib/firebase-admin.ts
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let firebaseConfig: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch {
  firebaseConfig = null;
}

if (!getApps().length && firebaseConfig?.projectId) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (err) {
    console.warn('[FirebaseAdmin] Failed to initialize:', err);
  }
}

export const adminAuth = getApps().length ? getAuth() : null;
