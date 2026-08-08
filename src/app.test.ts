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

  it('serves a valid OpenAPI spec covering all route groups at /docs.json', async () => {
    const response = await request(app).get('/docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths).toMatchObject({
      '/health': expect.any(Object),
      '/register': expect.any(Object),
      '/login': expect.any(Object),
      '/habits': expect.any(Object),
      '/habits/{id}': expect.any(Object),
      '/habits/{id}/track': expect.any(Object),
      '/habits/{id}/history': expect.any(Object),
    });
  });

  it('serves the Swagger UI at /docs', async () => {
    const response = await request(app).get('/docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/html/);
  });
});
