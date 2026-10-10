// src/middleware/validateInput.ts
import { Request, Response, NextFunction } from 'express';

const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

// Common SQL Injection signatures to detect and block malicious injection attempts
const SQL_INJECTION_PATTERN = /(\b(UNION(\s+ALL)?|SELECT\s+.*\s+FROM|INSERT\s+INTO|DELETE\s+FROM|DROP\s+(TABLE|DATABASE|VIEW)|ALTER\s+TABLE|EXEC(\s+XP_)?|--|\/\*|\*\/)\b|'\s*OR\s*['\d\w\s]*=\s*['\d\w\s]*|;\s*SHUTDOWN)/i;

/**
 * Recursively inspect and sanitize an object against Prototype Pollution & SQL injection
 */
export function sanitizeObject(obj: any, path: string = ''): { clean: any; hasDangerousPayload: boolean } {
  if (obj === null || obj === undefined) return { clean: obj, hasDangerousPayload: false };

  if (typeof obj === 'string') {
    // Check for null-byte injection
    if (obj.includes('\0') || obj.includes('%00')) {
      return { clean: obj.replace(/(\0|%00)/g, ''), hasDangerousPayload: true };
    }

    // Detect blatant SQL injection patterns in search/ID inputs
    if (SQL_INJECTION_PATTERN.test(obj)) {
      return { clean: obj, hasDangerousPayload: true };
    }

    // Strip null characters
    return { clean: obj.replace(/\0/g, ''), hasDangerousPayload: false };
  }

  if (Array.isArray(obj)) {
    let dangerous = false;
    const cleanArr = obj.map((item, idx) => {
      const res = sanitizeObject(item, `${path}[${idx}]`);
      if (res.hasDangerousPayload) dangerous = true;
      return res.clean;
    });
    return { clean: cleanArr, hasDangerousPayload: dangerous };
  }

  if (typeof obj === 'object') {
    let dangerous = false;
    const cleanObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Prototype Pollution Guard: Reject dangerous keys
      if (DANGEROUS_KEYS.includes(key.toLowerCase())) {
        dangerous = true;
        continue; // Strip key
      }

      const res = sanitizeObject(value, path ? `${path}.${key}` : key);
      if (res.hasDangerousPayload) dangerous = true;
      cleanObj[key] = res.clean;
    }

    return { clean: cleanObj, hasDangerousPayload: dangerous };
  }

  return { clean: obj, hasDangerousPayload: false };
}

/**
 * Global input sanitization & prototype pollution prevention middleware
 */
export function inputSanitizer(req: Request, res: Response, next: NextFunction) {
  // Check and sanitize body
  if (req.body && typeof req.body === 'object') {
    const { clean, hasDangerousPayload } = sanitizeObject(req.body);
    req.body = clean;
    if (hasDangerousPayload && req.method !== 'GET') {
      // If suspicious SQL injection pattern was detected in critical fields
      const bodyStr = JSON.stringify(req.body);
      if (SQL_INJECTION_PATTERN.test(bodyStr)) {
        console.warn(`[Security Alert] Blocked suspicious SQL injection payload from IP: ${req.ip}`);
        return res.status(400).json({ error: 'Malicious payload or invalid characters detected in request body.' });
      }
    }
  }

  // Check and sanitize query params
  if (req.query && typeof req.query === 'object') {
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') {
        if (v.includes('\0') || v.includes('%00')) {
          return res.status(400).json({ error: 'Null-byte injection detected in query parameter.' });
        }
        if (SQL_INJECTION_PATTERN.test(v)) {
          return res.status(400).json({ error: 'Invalid characters or SQL injection pattern detected in query.' });
        }
      }
    }
  }

  next();
}

/**
 * Route parameter validator for IDs (e.g. clientId, requestId, docId, userId)
 * Ensures parameter contains only safe alphanumeric, hyphen, underscore, and dot characters.
 */
export function validateSafeIdParam(...paramNames: string[]) {
  const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-\.]+$/;

  return (req: Request, res: Response, next: NextFunction) => {
    for (const name of paramNames) {
      const val = req.params[name];
      if (val && !SAFE_ID_REGEX.test(val)) {
        return res.status(400).json({
          error: `Invalid identifier format for parameter '${name}'. Must be alphanumeric characters only.`,
        });
      }
    }
    next();
  };
}

/**
 * Helper to validate GSTIN format (15 characters)
 */
export function isValidGstin(gstin: string): boolean {
  if (!gstin || typeof gstin !== 'string') return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin.trim());
}

/**
 * Helper to validate PAN format (10 characters)
 */
export function isValidPan(pan: string): boolean {
  if (!pan || typeof pan !== 'string') return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim());
}
