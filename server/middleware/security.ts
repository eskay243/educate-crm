import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AuthTokenPayload, verifyAuthToken, hasRequiredRole } from '../utils/security.js';

export interface AuthenticatedRequest extends Request {
  authUser?: AuthTokenPayload;
}

/**
 * Industry-standard HTTP security headers (X-Content-Type-Options, X-Frame-Options,
 * HSTS, Referrer-Policy, hides X-Powered-By) tuned for SPA + Paystack compatibility.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

/**
 * Brute-force rate limiter for authentication & password reset routes.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes and try again.',
  },
});

/**
 * Extracts and verifies Bearer JWT on every incoming request if present.
 */
export function attachAuthContext(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyAuthToken(token);
    if (payload) {
      req.authUser = payload;
    }
  }
  next();
}

/**
 * Enforces a verified JWT session.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in again.',
    });
  }
  return next();
}

/**
 * Enforces server-side Role-Based Access Control (RBAC).
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }
    if (!hasRequiredRole(req.authUser.role, allowedRoles)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Your role does not have permission for this operation.',
      });
    }
    return next();
  };
}
