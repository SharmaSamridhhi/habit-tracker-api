import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }

  next();
}

// Reads req.userId set by requireAuth. Throws instead of returning undefined
// so a route mounted without requireAuth fails loudly rather than silently
// scoping a query to `undefined`.
export function getUserId(req: Request): string {
  if (!req.userId) {
    throw AppError.unauthorized();
  }
  return req.userId;
}
