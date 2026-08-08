import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { errorHandler } from './errorHandler';
import { validate } from './validate';

function buildTestApp() {
  const app = express();
  app.use(express.json());

  const bodySchema = z.object({ title: z.string().min(1), count: z.coerce.number().default(1) });
  const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });

  app.post('/items', validate({ body: bodySchema }), (req, res) => {
    res.status(201).json(req.body);
  });

  app.get('/items', validate({ query: querySchema }), (req, res) => {
    res.status(200).json(req.query);
  });

  app.use(errorHandler);

  return app;
}

describe('validate middleware', () => {
  const app = buildTestApp();

  it('passes through and applies defaults for a valid body', async () => {
    const response = await request(app).post('/items').send({ title: 'Read a book' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ title: 'Read a book', count: 1 });
  });

  it('rejects an invalid body with a 400 and validation details', async () => {
    const response = await request(app).post('/items').send({ title: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('coerces and defaults query params', async () => {
    const response = await request(app).get('/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ page: 1 });
  });
});
