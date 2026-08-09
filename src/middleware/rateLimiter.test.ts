import express from 'express';
import request from 'supertest';
import { createPerUserRateLimiter } from './rateLimiter';

function buildTestApp() {
  const app = express();

  // Stands in for requireAuth: sets req.userId from a header so tests can
  // simulate distinct authenticated users without real JWTs.
  app.use((req, _res, next) => {
    const userId = req.header('x-test-user-id');
    if (userId) req.userId = userId;
    next();
  });

  app.use(createPerUserRateLimiter({ windowMs: 60_000, limit: 2 }));
  app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));

  return app;
}

describe('createPerUserRateLimiter', () => {
  it('allows requests up to the limit and blocks the next one with 429', async () => {
    const app = buildTestApp();

    const first = await request(app).get('/ping').set('x-test-user-id', 'user-a');
    const second = await request(app).get('/ping').set('x-test-user-id', 'user-a');
    const third = await request(app).get('/ping').set('x-test-user-id', 'user-a');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.error.message).toMatch(/too many requests/i);
  });

  it('tracks limits per user, so one user hitting the limit does not block another', async () => {
    const app = buildTestApp();

    await request(app).get('/ping').set('x-test-user-id', 'user-a');
    await request(app).get('/ping').set('x-test-user-id', 'user-a');
    const userABlocked = await request(app).get('/ping').set('x-test-user-id', 'user-a');

    const userBResponse = await request(app).get('/ping').set('x-test-user-id', 'user-b');

    expect(userABlocked.status).toBe(429);
    expect(userBResponse.status).toBe(200);
  });

  it('sets standard RateLimit-* headers', async () => {
    const app = buildTestApp();

    const response = await request(app).get('/ping').set('x-test-user-id', 'user-a');

    expect(response.headers).toHaveProperty('ratelimit-limit');
    expect(response.headers).toHaveProperty('ratelimit-remaining');
  });

  it('falls back to keying by IP when req.userId is not set', async () => {
    const app = buildTestApp();

    const first = await request(app).get('/ping');
    const second = await request(app).get('/ping');
    const third = await request(app).get('/ping');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
  });
});
