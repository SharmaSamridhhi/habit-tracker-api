import { z } from 'zod';

const REMINDER_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createHabitSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).optional(),
  frequency: z.enum(['daily', 'weekly'], {
    message: 'frequency must be "daily" or "weekly"',
  }),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  reminderTime: z
    .string()
    .regex(REMINDER_TIME_REGEX, 'reminderTime must be in HH:MM 24-hour format')
    .optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;

export const listHabitsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  tag: z.string().trim().min(1).optional(),
});

export type ListHabitsQuery = z.infer<typeof listHabitsQuerySchema>;

export const updateHabitSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200).optional(),
    description: z.string().trim().max(1000).optional(),
    frequency: z
      .enum(['daily', 'weekly'], { message: 'frequency must be "daily" or "weekly"' })
      .optional(),
    tags: z.array(z.string().trim().min(1)).max(20).optional(),
    reminderTime: z
      .string()
      .regex(REMINDER_TIME_REGEX, 'reminderTime must be in HH:MM 24-hour format')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const habitIdParamSchema = z.object({
  id: z.string().uuid('Invalid habit id'),
});

export type HabitIdParam = z.infer<typeof habitIdParamSchema>;
