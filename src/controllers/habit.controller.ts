import { Request, Response } from 'express';
import { getUserId } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { habitService } from '../services/habit.service';
import { CreateHabitInput, ListHabitsQuery } from '../validators/habit.validators';

export const createHabit = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const input = req.body as CreateHabitInput;

  const habit = await habitService.createHabit(userId, input);

  res.status(201).json({ habit });
});

export const listHabits = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const query = req.query as unknown as ListHabitsQuery;

  const result = await habitService.listHabits(userId, query);

  res.status(200).json(result);
});
