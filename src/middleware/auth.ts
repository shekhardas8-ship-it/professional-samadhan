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
    role: 'superadmin' | 'ca_admin' | 'staff' | 'client';
    displayName?: string;
    assignedClientIds?: string[];
    isSuperAdmin?: boolean;
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
  if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
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
          email: decoded.email || 'user@quinceca.com',
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

  // 2. Allow active workspace session for Superadmin / CA / Staff if designated
  if (staffRoleHeader && (staffRoleHeader === 'superadmin' || staffRoleHeader === 'ca_admin' || staffRoleHeader === 'staff')) {
    const userRec = staffUserIdHeader
      ? await db.select().from(users).where(eq(users.id, staffUserIdHeader)).limit(1)
      : [];

    const isSuper = staffRoleHeader === 'superadmin' || userRec[0]?.email?.toLowerCase() === 'shekhardas8@gmail.com';

    req.user = {
      uid: staffUserIdHeader || (isSuper ? 'superadmin_shekhar_01' : 'staff-default'),
      email: userRec[0]?.email || (isSuper ? 'shekhardas8@gmail.com' : staffRoleHeader === 'ca_admin' ? 'suraj.dutta@quinceca.com' : 'pooja.verma@quinceca.com'),
      role: isSuper ? 'superadmin' : staffRoleHeader,
      displayName: userRec[0]?.displayName || (isSuper ? 'Shekhar Das (Super Admin)' : staffRoleHeader === 'ca_admin' ? 'CA Suraj Dutta (FCA)' : 'Pooja Verma (Senior Associate)'),
      assignedClientIds: userRec[0]?.assignedClientIds || (isSuper ? [] : ['cli_bluebell_02', 'cli_apex_01']),
      isSuperAdmin: isSuper,
    };
    return next();
  }

  // Fallback default CA user for preview convenience if no header
  req.user = {
    uid: 'ca_rajesh_01',
    email: 'suraj.dutta@quinceca.com',
    role: 'ca_admin',
    displayName: 'CA Suraj Dutta (FCA)',
    assignedClientIds: [],
    isSuperAdmin: false,
  };
  next();
};

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const isSuper =
    req.user?.role === 'superadmin' ||
    req.user?.email?.toLowerCase() === 'shekhardas8@gmail.com' ||
    req.user?.isSuperAdmin === true;

  if (!isSuper) {
    return res.status(403).json({
      error: 'Access Denied: System Diagnostics & Super Admin Console are strictly restricted to Super Administrator (shekhardas8@gmail.com).',
    });
  }
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
      return res.status(403).json({ error: 'This secure upload link has expired. Please contact QuinceCA.' });
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
