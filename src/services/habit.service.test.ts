import { Habit, Prisma, TrackingLog } from '@prisma/client';
import { HabitRepository } from '../repositories/habit.repository';
import { TrackingLogRepository } from '../repositories/trackingLog.repository';
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
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(buildHabit()),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildTrackingLog(overrides: Partial<TrackingLog> = {}): TrackingLog {
  return {
    id: 'log-1',
    habitId: 'habit-1',
    completedOn: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}

function buildTrackingLogRepositoryMock(
  overrides: Partial<TrackingLogRepository> = {},
): TrackingLogRepository {
  return {
    create: jest.fn().mockResolvedValue(buildTrackingLog()),
    ...overrides,
  };
}

describe('habitService.createHabit', () => {
  it('merges the authenticated userId into the repository create call', async () => {
    const habitRepository = buildHabitRepositoryMock();
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });
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
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

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
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

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
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    const result = await habitService.listHabits('user-1', { page: 1, limit: 10 });

    expect(result.pagination.totalPages).toBe(0);
  });
});

describe('habitService.getHabit', () => {
  it('returns the habit when it exists and belongs to the user', async () => {
    const habit = buildHabit();
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(habit),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await expect(habitService.getHabit('user-1', 'habit-1')).resolves.toEqual(habit);
  });

  it('throws 404 when the habit does not exist', async () => {
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(null),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await expect(habitService.getHabit('user-1', 'missing')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 404 (not 403) when the habit belongs to a different user', async () => {
    const habit = buildHabit({ userId: 'someone-else' });
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(habit),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await expect(habitService.getHabit('user-1', 'habit-1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('habitService.updateHabit', () => {
  it('updates the habit when it is owned by the user', async () => {
    const habit = buildHabit();
    const updated = buildHabit({ title: 'Updated title' });
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(habit),
      update: jest.fn().mockResolvedValue(updated),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    const result = await habitService.updateHabit('user-1', 'habit-1', {
      title: 'Updated title',
    });

    expect(habitRepository.update).toHaveBeenCalledWith('habit-1', { title: 'Updated title' });
    expect(result).toEqual(updated);
  });

  it('throws 404 and does not call update when the habit is not owned by the user', async () => {
    const habit = buildHabit({ userId: 'someone-else' });
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(habit),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await expect(
      habitService.updateHabit('user-1', 'habit-1', { title: 'New title' }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(habitRepository.update).not.toHaveBeenCalled();
  });
});

describe('habitService.deleteHabit', () => {
  it('deletes the habit when it is owned by the user', async () => {
    const habit = buildHabit();
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(habit),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await habitService.deleteHabit('user-1', 'habit-1');

    expect(habitRepository.delete).toHaveBeenCalledWith('habit-1');
  });

  it('throws 404 and does not call delete when the habit is not owned by the user', async () => {
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(null),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await expect(habitService.deleteHabit('user-1', 'missing')).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(habitRepository.delete).not.toHaveBeenCalled();
  });
});

describe('habitService.trackHabit', () => {
  it('creates a tracking log for today when the habit is owned by the user', async () => {
    const habit = buildHabit();
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(habit),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await habitService.trackHabit('user-1', 'habit-1');

    expect(trackingLogRepository.create).toHaveBeenCalledWith({
      habitId: 'habit-1',
      completedOn: expect.any(Date),
    });
  });

  it('throws 404 and does not create a log when the habit is not owned by the user', async () => {
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(null),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock();
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await expect(habitService.trackHabit('user-1', 'missing')).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(trackingLogRepository.create).not.toHaveBeenCalled();
  });

  it('translates a duplicate-day unique constraint violation into a 409', async () => {
    const habit = buildHabit();
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(habit),
    });
    const conflictError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock({
      create: jest.fn().mockRejectedValue(conflictError),
    });
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await expect(habitService.trackHabit('user-1', 'habit-1')).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('rethrows unexpected errors from the repository', async () => {
    const habit = buildHabit();
    const habitRepository = buildHabitRepositoryMock({
      findById: jest.fn().mockResolvedValue(habit),
    });
    const trackingLogRepository = buildTrackingLogRepositoryMock({
      create: jest.fn().mockRejectedValue(new Error('connection lost')),
    });
    const habitService = createHabitService({ habitRepository, trackingLogRepository });

    await expect(habitService.trackHabit('user-1', 'habit-1')).rejects.toThrow('connection lost');
  });
});
