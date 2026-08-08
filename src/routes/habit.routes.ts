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

/**
 * @openapi
 * /habits:
 *   post:
 *     summary: Create a new habit for the authenticated user
 *     tags: [Habits]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, frequency]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Drink 2L of water
 *               description:
 *                 type: string
 *                 example: Stay hydrated throughout the day
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly]
 *               tags:
 *                 type: array
 *                 items: { type: string }
 *                 example: [health]
 *               reminderTime:
 *                 type: string
 *                 example: '08:00'
 *                 description: 24-hour HH:MM, stored only (no notifications are sent)
 *     responses:
 *       201:
 *         description: Habit created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 habit: { $ref: '#/components/schemas/Habit' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
habitRouter.post('/habits', validate({ body: createHabitSchema }), createHabit);

/**
 * @openapi
 * /habits:
 *   get:
 *     summary: List the authenticated user's habits
 *     tags: [Habits]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *       - name: tag
 *         in: query
 *         schema: { type: string }
 *         description: Filter to habits containing this tag
 *     responses:
 *       200:
 *         description: A page of the user's habits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Habit' }
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
habitRouter.get('/habits', validate({ query: listHabitsQuerySchema }), listHabits);

/**
 * @openapi
 * /habits/{id}:
 *   get:
 *     summary: Get a single habit
 *     tags: [Habits]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: The habit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 habit: { $ref: '#/components/schemas/Habit' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
habitRouter.get('/habits/:id', validate({ params: habitIdParamSchema }), getHabit);

/**
 * @openapi
 * /habits/{id}:
 *   put:
 *     summary: Update a habit (partial update; at least one field required)
 *     tags: [Habits]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               frequency: { type: string, enum: [daily, weekly] }
 *               tags: { type: array, items: { type: string } }
 *               reminderTime: { type: string, example: '08:00' }
 *     responses:
 *       200:
 *         description: The updated habit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 habit: { $ref: '#/components/schemas/Habit' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
habitRouter.put(
  '/habits/:id',
  validate({ params: habitIdParamSchema, body: updateHabitSchema }),
  updateHabit,
);

/**
 * @openapi
 * /habits/{id}:
 *   delete:
 *     summary: Delete a habit
 *     tags: [Habits]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Habit deleted
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
habitRouter.delete('/habits/:id', validate({ params: habitIdParamSchema }), deleteHabit);

/**
 * @openapi
 * /habits/{id}/track:
 *   post:
 *     summary: Mark the habit as completed for today
 *     description: Only one tracking entry per habit per day is allowed; a repeat call the same day returns 409.
 *     tags: [Habits]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Tracking log created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trackingLog: { $ref: '#/components/schemas/TrackingLog' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Habit already tracked for today
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
habitRouter.post('/habits/:id/track', validate({ params: habitIdParamSchema }), trackHabit);

/**
 * @openapi
 * /habits/{id}/history:
 *   get:
 *     summary: Get the last 7 days of tracking plus the current streak
 *     tags: [Habits]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: 7-day completion history (oldest first) and current streak
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date: { type: string, format: date }
 *                       completed: { type: boolean }
 *                 streak:
 *                   type: integer
 *                   description: Consecutive completed days, ending today (or yesterday if today isn't logged yet)
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
habitRouter.get('/habits/:id/history', validate({ params: habitIdParamSchema }), getHabitHistory);
