import { Request, Response } from 'express';
import { getUserId } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { habitService } from '../services/habit.service';
import {
  CreateHabitInput,
  HabitIdParam,
  ListHabitsQuery,
  UpdateHabitInput,
} from '../validators/habit.validators';

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

export const getHabit = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params as unknown as HabitIdParam;

  const habit = await habitService.getHabit(userId, id);

  res.status(200).json({ habit });
});

export const updateHabit = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params as unknown as HabitIdParam;
  const input = req.body as UpdateHabitInput;

  const habit = await habitService.updateHabit(userId, id, input);

  res.status(200).json({ habit });
});

export const deleteHabit = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params as unknown as HabitIdParam;

  await habitService.deleteHabit(userId, id);

  res.status(204).send();
});

export const trackHabit = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params as unknown as HabitIdParam;

  const trackingLog = await habitService.trackHabit(userId, id);

  res.status(201).json({ trackingLog });
});
