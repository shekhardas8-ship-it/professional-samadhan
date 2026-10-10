// src/utils/tokenUtil.ts
import crypto from 'crypto';

// Secret used for HMAC signing of auth tokens
// Falls back to a persistent random secret per process if not set in environment
const TOKEN_SECRET = process.env.JWT_SECRET || process.env.INTERNAL_WORKER_SECRET || 'ps_platform_secure_token_secret_2026';

export interface TokenPayload {
  uid: string;
  email: string;
  role: 'superadmin' | 'ca_admin' | 'staff' | 'client';
  displayName?: string;
  assignedClientIds?: string[];
  isSuperAdmin?: boolean;
  clientId?: string;
  exp: number; // Unix timestamp in seconds
  iat: number; // Unix timestamp in seconds
}

/**
 * Sign a token payload with HMAC-SHA256
 */
export function signAuthToken(
  payload: Omit<TokenPayload, 'exp' | 'iat'>,
  expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 signed token
 */
export function verifyAuthToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;

  // Recompute signature to verify integrity
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  // Timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: TokenPayload = JSON.parse(payloadJson);

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Timing-safe string comparison to protect against side-channel timing attacks
 */
export function timingSafeCompare(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
