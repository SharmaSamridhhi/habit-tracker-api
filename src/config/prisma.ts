import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Reuse a single client across module reloads in dev (tsx watch) to avoid
// exhausting Postgres connections; a fresh instance is fine in production.
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
