import { Request } from 'express';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../config/env';
import { signToken } from '../utils/jwt';
import { errorHandler } from './errorHandler';
import { getUserId, requireAuth } from './auth.middleware';

function buildTestApp() {
  const app = express();

  app.get('/protected', requireAuth, (req, res) => {
    res.status(200).json({ userId: req.userId });
  });

  app.use(errorHandler);

  return app;
}

describe('requireAuth', () => {
  const app = buildTestApp();

  it('allows the request through and attaches userId for a valid token', async () => {
    const token = signToken({ sub: 'user-123' });

    const response = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'user-123' });
  });

  it('rejects a request with no Authorization header', async () => {
    const response = await request(app).get('/protected');

    expect(response.status).toBe(401);
  });

  it('rejects a request missing the "Bearer " prefix', async () => {
    const token = signToken({ sub: 'user-123' });

    const response = await request(app).get('/protected').set('Authorization', token);

    expect(response.status).toBe(401);
  });

  it('rejects a token signed with a different secret', async () => {
    const foreignToken = jwt.sign({ sub: 'user-123' }, 'a-different-secret');

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${foreignToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expiredToken = jwt.sign({ sub: 'user-123' }, env.JWT_SECRET, { expiresIn: -10 });

    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const response = await request(app).get('/protected').set('Authorization', 'Bearer garbage');

    expect(response.status).toBe(401);
  });
});

describe('getUserId', () => {
  it('returns req.userId when set', () => {
    const req = { userId: 'user-123' } as Request;

    expect(getUserId(req)).toBe('user-123');
  });

  it('throws 401 if called on a request requireAuth never ran on', () => {
    const req = {} as Request;

    expect(() => getUserId(req)).toThrow(expect.objectContaining({ statusCode: 401 }));
  });
});
