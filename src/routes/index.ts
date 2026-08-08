import { Router } from 'express';
import { authRouter } from './auth.routes';
import { habitRouter } from './habit.routes';
import { healthRouter } from './health.routes';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(habitRouter);
