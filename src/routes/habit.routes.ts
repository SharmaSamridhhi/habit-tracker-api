import { Router } from 'express';
import {
  createHabit,
  deleteHabit,
  getHabit,
  getHabitHistory,
  listHabits,
  trackHabit,
  updateHabit,
} from '../controllers/habit.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { perUserRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import {
  createHabitSchema,
  habitIdParamSchema,
  listHabitsQuerySchema,
  updateHabitSchema,
} from '../validators/habit.validators';

export const habitRouter = Router();

// Scoped to the /habits prefix (rather than router-wide) so unmatched
// routes still fall through to notFoundHandler instead of getting a 401.
habitRouter.use('/habits', requireAuth);
// Runs after requireAuth so the limiter can key by req.userId.
habitRouter.use('/habits', perUserRateLimiter);

habitRouter.post('/habits', validate({ body: createHabitSchema }), createHabit);
habitRouter.get('/habits', validate({ query: listHabitsQuerySchema }), listHabits);
habitRouter.get('/habits/:id', validate({ params: habitIdParamSchema }), getHabit);
habitRouter.put(
  '/habits/:id',
  validate({ params: habitIdParamSchema, body: updateHabitSchema }),
  updateHabit,
);
habitRouter.delete('/habits/:id', validate({ params: habitIdParamSchema }), deleteHabit);
habitRouter.post('/habits/:id/track', validate({ params: habitIdParamSchema }), trackHabit);
habitRouter.get('/habits/:id/history', validate({ params: habitIdParamSchema }), getHabitHistory);
