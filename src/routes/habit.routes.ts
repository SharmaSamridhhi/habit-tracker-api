import { Router } from 'express';
import { createHabit, listHabits } from '../controllers/habit.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createHabitSchema, listHabitsQuerySchema } from '../validators/habit.validators';

export const habitRouter = Router();

// Scoped to the /habits prefix (rather than router-wide) so unmatched
// routes still fall through to notFoundHandler instead of getting a 401.
habitRouter.use('/habits', requireAuth);

habitRouter.post('/habits', validate({ body: createHabitSchema }), createHabit);
habitRouter.get('/habits', validate({ query: listHabitsQuerySchema }), listHabits);
