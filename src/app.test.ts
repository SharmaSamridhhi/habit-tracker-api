import request from 'supertest';
import { createApp } from './app';

describe('createApp', () => {
  const app = createApp();

  it('returns a 404 with a JSON error body for unknown routes', async () => {
    const response = await request(app).get('/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toMatch(/route not found/i);
  });

  it('sets security headers via helmet', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
