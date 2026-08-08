import { Prisma } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { AppError } from '../utils/AppError';
import { errorHandler } from './errorHandler';

function buildTestApp() {
  const app = express();

  app.get('/app-error', () => {
    throw AppError.conflict('Habit already tracked today');
  });

  app.get('/zod-error', () => {
    z.object({ title: z.string() }).parse({});
  });

  app.get('/prisma-unique-error', () => {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.1.0',
    });
  });

  app.get('/prisma-not-found-error', () => {
    throw new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.1.0',
    });
  });

  app.get('/unexpected-error', () => {
    throw new Error('Something exploded');
  });

  app.use(errorHandler);

  return app;
}

describe('errorHandler', () => {
  const app = buildTestApp();

  it('formats AppError using its own status code and message', async () => {
    const response = await request(app).get('/app-error');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: { message: 'Habit already tracked today' } });
  });

  it('formats ZodError as a 400 with field-level details', async () => {
    const response = await request(app).get('/zod-error');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'title' })]),
    );
  });

  it('maps Prisma unique constraint violations to 409', async () => {
    const response = await request(app).get('/prisma-unique-error');

    expect(response.status).toBe(409);
    expect(response.body.error.message).toMatch(/already exists/i);
  });

  it('maps Prisma "record not found" errors to 404', async () => {
    const response = await request(app).get('/prisma-not-found-error');

    expect(response.status).toBe(404);
  });

  it('falls back to a generic 500 for unexpected errors without leaking details', async () => {
    const response = await request(app).get('/unexpected-error');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { message: 'Internal server error' } });
  });
});
