// src/middleware/securityHeaders.ts
import { Request, Response, NextFunction } from 'express';

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Legacy XSS filter protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enforce HTTPS HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Permissions-Policy (disable unneeded hardware access)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Cross-Origin Opener Policy
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Content-Security-Policy (Allow local dev assets, Google Fonts, and secure API connections)
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.googleusercontent.com https://api.qrserver.com",
      "connect-src 'self' https://*.neon.tech https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com ws: wss: http://localhost:*",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Prevent caching of sensitive financial API payloads and confidential client documents
  if (req.path.startsWith('/api/') && !req.path.startsWith('/api/firm-branding') && !req.path.startsWith('/api/health')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * Strict CORS policy middleware
 */
export function corsSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // Allowed origin list (Local dev + official practice domains)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'https://app.quinceca.com',
  ];

  if (process.env.APP_URL) {
    try {
      const parsed = new URL(process.env.APP_URL).origin;
      if (!allowedOrigins.includes(parsed)) {
        allowedOrigins.push(parsed);
      }
    } catch {}
  }

  if (origin) {
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.onrender.com');
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-role, x-user-id, x-upload-token');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
  }

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
}
