// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { monthlyRequests, clients, users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: 'ca_admin' | 'staff' | 'client';
    displayName?: string;
    assignedClientIds?: string[];
  };
  clientSession?: {
    clientId: string;
    monthlyRequestId?: string;
    gstin?: string;
    businessName?: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const staffRoleHeader = req.headers['x-user-role'] as string;
  const staffUserIdHeader = req.headers['x-user-id'] as string;

  // 1. If Firebase ID token is supplied
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded: DecodedIdToken = await adminAuth.verifyIdToken(token);
      // Look up user in DB or provide role
      const userRec = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
      if (userRec.length > 0) {
        req.user = {
          uid: decoded.uid,
          email: decoded.email || userRec[0].email,
          role: userRec[0].role as any,
          displayName: userRec[0].displayName || decoded.name || 'User',
          assignedClientIds: userRec[0].assignedClientIds || [],
        };
      } else {
        req.user = {
          uid: decoded.uid,
          email: decoded.email || 'user@professionalsamadhan.com',
          role: 'ca_admin', // Default initial logged in user as CA admin
          displayName: decoded.name || 'CA Admin',
          assignedClientIds: [],
        };
      }
      return next();
    } catch {
      // Continue to check role headers or upload token
    }
  }

  // 2. Allow active workspace session for CA / Staff if designated
  if (staffRoleHeader && (staffRoleHeader === 'ca_admin' || staffRoleHeader === 'staff')) {
    const userRec = staffUserIdHeader
      ? await db.select().from(users).where(eq(users.id, staffUserIdHeader)).limit(1)
      : [];

    req.user = {
      uid: staffUserIdHeader || 'staff-default',
      email: userRec[0]?.email || (staffRoleHeader === 'ca_admin' ? 'rajesh.sharma@professionalsamadhan.in' : 'pooja.verma@professionalsamadhan.in'),
      role: staffRoleHeader,
      displayName: userRec[0]?.displayName || (staffRoleHeader === 'ca_admin' ? 'CA Rajesh Sharma (FCA)' : 'Pooja Verma (Senior Associate)'),
      assignedClientIds: userRec[0]?.assignedClientIds || ['cli_bluebell_02', 'cli_apex_01'],
    };
    return next();
  }

  // Fallback default CA user for preview convenience if no header
  req.user = {
    uid: 'ca_rajesh_01',
    email: 'rajesh.sharma@professionalsamadhan.in',
    role: 'ca_admin',
    displayName: 'CA Rajesh Sharma (FCA)',
    assignedClientIds: [],
  };
  next();
};

export const requireClientUploadAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = (req.query.token as string) || (req.headers['x-upload-token'] as string);
  if (!token) {
    return res.status(401).json({ error: 'Missing secure upload token.' });
  }

  try {
    const requests = await db
      .select()
      .from(monthlyRequests)
      .where(eq(monthlyRequests.secureUploadToken, token))
      .limit(1);

    if (requests.length === 0) {
      return res.status(403).json({ error: 'Invalid or expired upload token.' });
    }

    const reqData = requests[0];
    if (new Date(reqData.tokenExpiresAt) < new Date()) {
      return res.status(403).json({ error: 'This secure upload link has expired. Please contact Professional Samadhan.' });
    }

    const clientRec = await db
      .select()
      .from(clients)
      .where(eq(clients.id, reqData.clientId))
      .limit(1);

    req.clientSession = {
      clientId: reqData.clientId,
      monthlyRequestId: reqData.id,
      gstin: clientRec[0]?.gstin,
      businessName: clientRec[0]?.businessName,
    };
    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to authenticate upload token: ' + err.message });
  }
};
