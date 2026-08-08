import { Habit } from '@prisma/client';
import { HabitRepository } from '../repositories/habit.repository';
import { createHabitService } from './habit.service';

function buildHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    title: 'Drink water',
    description: null,
    frequency: 'daily',
    tags: [],
    reminderTime: null,
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildHabitRepositoryMock(overrides: Partial<HabitRepository> = {}): HabitRepository {
  return {
    create: jest.fn().mockResolvedValue(buildHabit()),
    findManyByUser: jest.fn().mockResolvedValue([]),
    countByUser: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe('habitService.createHabit', () => {
  it('merges the authenticated userId into the repository create call', async () => {
    const habitRepository = buildHabitRepositoryMock();
    const habitService = createHabitService({ habitRepository });
    const input = { title: 'Read', frequency: 'daily' as const, tags: [] };

    await habitService.createHabit('user-1', input);

    expect(habitRepository.create).toHaveBeenCalledWith({ ...input, userId: 'user-1' });
  });
});

describe('habitService.listHabits', () => {
  it('computes skip/take from page and limit and returns a pagination envelope', async () => {
    const habitRepository = buildHabitRepositoryMock({
      findManyByUser: jest.fn().mockResolvedValue([buildHabit()]),
      countByUser: jest.fn().mockResolvedValue(21),
    });
    const habitService = createHabitService({ habitRepository });

    const result = await habitService.listHabits('user-1', { page: 3, limit: 10 });

    expect(habitRepository.findManyByUser).toHaveBeenCalledWith({
      userId: 'user-1',
      tag: undefined,
      skip: 20,
      take: 10,
    });
    expect(result.pagination).toEqual({ page: 3, limit: 10, total: 21, totalPages: 3 });
    expect(result.data).toHaveLength(1);
  });

  it('passes the tag filter through to the repository', async () => {
    const habitRepository = buildHabitRepositoryMock();
    const habitService = createHabitService({ habitRepository });

    await habitService.listHabits('user-1', { page: 1, limit: 10, tag: 'health' });

    expect(habitRepository.findManyByUser).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'health' }),
    );
    expect(habitRepository.countByUser).toHaveBeenCalledWith(
      expect.objectContaining({ tag: 'health' }),
    );
  });

  it('returns 0 totalPages instead of NaN when there are no results', async () => {
    const habitRepository = buildHabitRepositoryMock();
    const habitService = createHabitService({ habitRepository });

    const result = await habitService.listHabits('user-1', { page: 1, limit: 10 });

    expect(result.pagination.totalPages).toBe(0);
  });
});
