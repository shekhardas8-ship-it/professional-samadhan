// src/middleware/rateLimiter.ts
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class SlidingWindowRateLimiter {
  private buckets = new Map<string, RateLimitRecord>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly name: string;

  constructor(name: string, limit: number, windowMs: number) {
    this.name = name;
    this.limit = limit;
    this.windowMs = windowMs;

    // Periodic sweep to prevent memory bloat
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.buckets.entries()) {
        if (now > record.resetTime) {
          this.buckets.delete(key);
        }
      }
    }, Math.min(windowMs, 60000));
  }

  /**
   * Extract reliable client IP address
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      // Pick first IP if multiple are present in header
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
  }

  public middleware(identifierKeyFn?: (req: Request) => string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = this.getClientIp(req);
      const customKey = identifierKeyFn ? identifierKeyFn(req) : '';
      const bucketKey = `${this.name}:${customKey || ip}`;

      const now = Date.now();
      let record = this.buckets.get(bucketKey);

      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + this.windowMs };
        this.buckets.set(bucketKey, record);
      } else {
        record.count++;
      }

      const remaining = Math.max(0, this.limit - record.count);
      const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

      // Set standard RFC / draft rate limit headers
      res.setHeader('X-RateLimit-Limit', this.limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      if (record.count > this.limit) {
        res.setHeader('Retry-After', resetSeconds);
        return res.status(429).json({
          error: `Rate limit exceeded for ${this.name}. Please wait ${resetSeconds} seconds before retrying.`,
          retryAfter: resetSeconds,
          status: 429,
        });
      }

      next();
    };
  }
}

// 1. General API rate limiter: max 150 requests per minute
export const generalApiLimiter = new SlidingWindowRateLimiter('api', 150, 60 * 1000).middleware();

// 2. Strict Authentication rate limiter: max 10 attempts per 15 minutes per IP
export const authLimiter = new SlidingWindowRateLimiter('auth', 10, 15 * 60 * 1000).middleware();

// 3. File Upload rate limiter: max 30 upload batches per 10 minutes per IP
export const uploadLimiter = new SlidingWindowRateLimiter('upload', 30, 10 * 60 * 1000).middleware();

// 4. AI Copilot / LLM rate limiter: max 25 queries per 5 minutes
export const aiCopilotLimiter = new SlidingWindowRateLimiter('ai_copilot', 25, 5 * 60 * 1000).middleware();

// 5. Messaging / WhatsApp / Email dispatch limiter: max 15 requests per 10 minutes
export const messagingLimiter = new SlidingWindowRateLimiter('messaging', 15, 10 * 60 * 1000).middleware();

// 6. Worker / Internal sync limiter: max 120 calls per minute
export const workerLimiter = new SlidingWindowRateLimiter('worker', 120, 60 * 1000).middleware();
