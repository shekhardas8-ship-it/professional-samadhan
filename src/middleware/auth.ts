// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { monthlyRequests, clients, users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { verifyAuthToken, timingSafeCompare } from '../utils/tokenUtil.ts';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: 'superadmin' | 'ca_admin' | 'staff' | 'client';
    displayName?: string;
    assignedClientIds?: string[];
    isSuperAdmin?: boolean;
    clientId?: string;
  };
  clientSession?: {
    clientId: string;
    monthlyRequestId?: string;
    gstin?: string;
    businessName?: string;
  };
}

/**
 * Authentication Middleware: Verifies cryptographic HMAC token or Firebase ID token.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const staffRoleHeader = req.headers['x-user-role'] as string;
  const staffUserIdHeader = req.headers['x-user-id'] as string;

  // 1. Check Bearer Token (HMAC Signed Token or Firebase ID Token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();

    // 1a. Try HMAC-SHA256 Token
    const verifiedPayload = verifyAuthToken(token);
    if (verifiedPayload) {
      req.user = {
        uid: verifiedPayload.uid,
        email: verifiedPayload.email,
        role: verifiedPayload.role,
        displayName: verifiedPayload.displayName || 'User',
        assignedClientIds: verifiedPayload.assignedClientIds || [],
        isSuperAdmin: verifiedPayload.isSuperAdmin || verifiedPayload.role === 'superadmin',
        clientId: verifiedPayload.clientId,
      };
      return next();
    }

    // 1b. Try Firebase Admin ID Token
    if (adminAuth) {
      try {
        const decoded: DecodedIdToken = await adminAuth.verifyIdToken(token);
        const userRec = await db.select().from(users).where(eq(users.id, decoded.uid)).limit(1);
        const isSuper = userRec[0]?.role === 'superadmin' || decoded.email?.toLowerCase() === 'shekhardas8@gmail.com';

        if (userRec.length > 0) {
          req.user = {
            uid: decoded.uid,
            email: decoded.email || userRec[0].email,
            role: userRec[0].role as any,
            displayName: userRec[0].displayName || decoded.name || 'User',
            assignedClientIds: userRec[0].assignedClientIds || [],
            isSuperAdmin: isSuper,
          };
        } else {
          req.user = {
            uid: decoded.uid,
            email: decoded.email || 'user@quinceca.com',
            role: isSuper ? 'superadmin' : 'ca_admin',
            displayName: decoded.name || (isSuper ? 'Shekhar Das (Super Admin)' : 'CA Admin'),
            assignedClientIds: [],
            isSuperAdmin: isSuper,
          };
        }
        return next();
      } catch {
        // Fall through to dev header check
      }
    }
  }

  // 2. Controlled Role Header Check / Dev Fallback (For testing & local environment)
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    if (staffRoleHeader && ['superadmin', 'ca_admin', 'staff', 'client'].includes(staffRoleHeader)) {
      const userRec = staffUserIdHeader
        ? await db.select().from(users).where(eq(users.id, staffUserIdHeader)).limit(1)
        : [];

      const isSuper = staffRoleHeader === 'superadmin' || userRec[0]?.email?.toLowerCase() === 'shekhardas8@gmail.com';

      req.user = {
        uid: staffUserIdHeader || (isSuper ? 'superadmin_shekhar_01' : staffRoleHeader === 'ca_admin' ? 'ca_suraj_01' : 'staff-default'),
        email: userRec[0]?.email || (isSuper ? 'shekhardas8@gmail.com' : staffRoleHeader === 'ca_admin' ? 'suraj.dutta@quinceca.com' : 'pooja.verma@quinceca.com'),
        role: isSuper ? 'superadmin' : (staffRoleHeader as any),
        displayName: userRec[0]?.displayName || (isSuper ? 'Shekhar Das (Super Admin)' : staffRoleHeader === 'ca_admin' ? 'CA Suraj Dutta (FCA)' : 'Pooja Verma (Associate)'),
        assignedClientIds: userRec[0]?.assignedClientIds || (isSuper ? [] : ['cli_bluebell_02', 'cli_apex_01']),
        isSuperAdmin: isSuper,
      };
      return next();
    }

    // Default to Super Admin in local development so frontend never faces 401 sync drops
    req.user = {
      uid: 'superadmin_shekhar_01',
      email: 'shekhardas8@gmail.com',
      role: 'superadmin',
      displayName: 'Shekhar Das (Super Admin)',
      assignedClientIds: [],
      isSuperAdmin: true,
    };
    return next();
  }

  // 3. Reject unauthenticated requests in production
  return res.status(401).json({
    error: 'Authentication required. Please provide a valid Authorization Bearer token.',
  });
};

/**
 * Authorization: Strictly restricts access to Super Administrator (shekhardas8@gmail.com)
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const isSuper =
    req.user?.role === 'superadmin' ||
    (req.user?.role !== 'client' && req.user?.role !== 'staff' && (req.user?.email?.toLowerCase() === 'shekhardas8@gmail.com' || req.user?.isSuperAdmin === true));

  if (!isSuper) {
    return res.status(403).json({
      error: 'Access Denied: Super Admin console and system diagnostics are restricted to Super Administrator.',
    });
  }
  next();
};

/**
 * Authorization: Restricts access to CA Partners/Admins and Super Admin
 */
export const requireCaAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const hasAccess =
    req.user?.role === 'superadmin' ||
    req.user?.role === 'ca_admin';

  if (!hasAccess) {
    return res.status(403).json({
      error: 'Access Denied: Action requires CA Partner or Administrator authorization.',
    });
  }
  next();
};

/**
 * Authorization: Restricts access to Practice Members (Super Admin, CA Admin, or Staff)
 */
export const requireStaffOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const hasAccess =
    req.user?.role === 'superadmin' ||
    req.user?.role === 'ca_admin' ||
    req.user?.role === 'staff';

  if (!hasAccess) {
    return res.status(403).json({
      error: 'Access Denied: Action requires staff or administrator authorization.',
    });
  }
  next();
};

/**
 * Authorization & IDOR Guard: Verify that requesting user has permission to access specific client data
 */
export const requireClientAccess = (getClientId: (req: AuthRequest) => string | undefined) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const targetClientId = getClientId(req);
    if (!targetClientId) {
      return res.status(400).json({ error: 'Target Client ID is required for access verification.' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Super Admin and CA Admin have full practice access
    if (user.role === 'superadmin' || user.role === 'ca_admin' || user.isSuperAdmin) {
      return next();
    }

    // Staff access: check assignedClientIds
    if (user.role === 'staff') {
      const assigned = user.assignedClientIds || [];
      if (assigned.length === 0 || assigned.includes(targetClientId)) {
        return next();
      }
      return res.status(403).json({
        error: `Access Denied: You are not assigned to client ${targetClientId}.`,
      });
    }

    // Client access: can ONLY access their own client data
    if (user.role === 'client') {
      const allowedId = user.clientId || user.uid;
      if (allowedId === targetClientId) {
        return next();
      }
      return res.status(403).json({
        error: 'Access Denied: You are not authorized to view another client\'s documents.',
      });
    }

    return res.status(403).json({ error: 'Access Denied: Unauthorized role.' });
  };
};

/**
 * Authorization: Verifies Background Worker Secret or Staff/Admin credentials
 */
export const requireWorkerOrAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const workerSecret = process.env.INTERNAL_WORKER_SECRET;
  const authHeader = req.headers.authorization;
  const suppliedSecret = req.headers['x-worker-secret'] as string;

  // 1. Verify Worker Secret with Timing-Safe comparison
  if (workerSecret && suppliedSecret && timingSafeCompare(workerSecret, suppliedSecret)) {
    return next();
  }

  // 2. Check Bearer worker secret: Authorization: Bearer <secret>
  if (workerSecret && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (timingSafeCompare(workerSecret, token)) {
      return next();
    }
  }

  // 3. Fallback to standard admin/staff authentication
  return requireAuth(req, res, () => {
    if (req.user && ['superadmin', 'ca_admin', 'staff'].includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: 'Worker authorization or staff credentials required.' });
  });
};

/**
 * Authentication: Verifies secure client upload token against database
 */
export const requireClientUploadAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token =
    (req.query.token as string) ||
    (req.headers['x-upload-token'] as string) ||
    (req.body && req.body.secureUploadToken) ||
    (req.body && req.body.token);

  if (!token) {
    return res.status(401).json({ error: 'Missing secure upload token.' });
  }

  try {
    const requests = await db
      .select()
      .from(monthlyRequests)
      .where(eq(monthlyRequests.secureUploadToken, String(token).trim()))
      .limit(1);

    if (requests.length === 0) {
      return res.status(403).json({ error: 'Invalid or expired upload token.' });
    }

    const reqData = requests[0];
    if (reqData.tokenExpiresAt && new Date(reqData.tokenExpiresAt) < new Date()) {
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

    req.user = {
      uid: reqData.clientId,
      email: clientRec[0]?.email || 'client@quinceca.com',
      role: 'client',
      displayName: clientRec[0]?.contactPerson || 'Client User',
      clientId: reqData.clientId,
    };

    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to authenticate upload token: ' + err.message });
  }
};
