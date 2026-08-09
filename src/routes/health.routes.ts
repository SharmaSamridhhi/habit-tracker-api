import { Router } from 'express';

// OpenAPI docs for these routes: src/docs/health.openapi.ts
export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
