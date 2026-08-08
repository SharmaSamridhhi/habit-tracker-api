import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  var __prisma: PrismaClient | undefined;
}

function logLevels(): ('warn' | 'error')[] {
  if (env.NODE_ENV === 'development') return ['warn', 'error'];
  // Tests intentionally trigger and handle expected DB errors (e.g. unique
  // constraint violations); logging them would just be noise in test output.
  if (env.NODE_ENV === 'test') return [];
  return ['error'];
}

// Reuse a single client across module reloads in dev (tsx watch) to avoid
// exhausting Postgres connections; a fresh instance is fine in production.
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: logLevels(),
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
