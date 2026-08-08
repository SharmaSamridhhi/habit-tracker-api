import { Express } from 'express';
import request from 'supertest';

interface HabitOverrides {
  title?: string;
  description?: string;
  frequency?: 'daily' | 'weekly';
  tags?: string[];
  reminderTime?: string;
}

export async function createTestHabit(
  app: Express,
  token: string,
  overrides: HabitOverrides = {},
): Promise<string> {
  const response = await request(app)
    .post('/habits')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Test habit', frequency: 'daily', ...overrides });

  return response.body.habit.id as string;
}
