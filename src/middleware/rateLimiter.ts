import { Request } from 'express';
import rateLimit, { Options } from 'express-rate-limit';
import { env } from '../config/env';

type RateLimiterOverrides = Partial<Pick<Options, 'windowMs' | 'limit'>>;

// Keyed by the authenticated user (not IP), since this is meant to run
// after requireAuth on protected routes. Falls back to req.ip only for the
// unreachable-in-practice case of this being mounted without requireAuth.
export function createPerUserRateLimiter(overrides: RateLimiterOverrides = {}) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.userId ?? req.ip ?? 'anonymous',
    message: { error: { message: 'Too many requests, please try again later' } },
    ...overrides,
  });
}

export const perUserRateLimiter = createPerUserRateLimiter();
