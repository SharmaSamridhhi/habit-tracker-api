import { Habit } from '@prisma/client';
import { habitRepository, HabitRepository } from '../repositories/habit.repository';
import { AppError } from '../utils/AppError';
import {
  CreateHabitInput,
  ListHabitsQuery,
  UpdateHabitInput,
} from '../validators/habit.validators';

interface HabitServiceDeps {
  habitRepository: HabitRepository;
}

export interface PaginatedHabits {
  data: Habit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function createHabitService({ habitRepository: habits }: HabitServiceDeps) {
  // Returns 404 (never 403) when the habit belongs to someone else, so a
  // caller can't distinguish "not found" from "not yours" and enumerate ids.
  async function requireOwnedHabit(userId: string, id: string): Promise<Habit> {
    const habit = await habits.findById(id);
    if (!habit || habit.userId !== userId) {
      throw AppError.notFound('Habit not found');
    }
    return habit;
  }

  return {
    async createHabit(userId: string, input: CreateHabitInput): Promise<Habit> {
      return habits.create({ ...input, userId });
    },

    async listHabits(userId: string, query: ListHabitsQuery): Promise<PaginatedHabits> {
      const skip = (query.page - 1) * query.limit;

      const [data, total] = await Promise.all([
        habits.findManyByUser({ userId, tag: query.tag, skip, take: query.limit }),
        habits.countByUser({ userId, tag: query.tag }),
      ]);

      return {
        data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
        },
      };
    },

    async getHabit(userId: string, id: string): Promise<Habit> {
      return requireOwnedHabit(userId, id);
    },

    async updateHabit(userId: string, id: string, input: UpdateHabitInput): Promise<Habit> {
      await requireOwnedHabit(userId, id);
      return habits.update(id, input);
    },

    async deleteHabit(userId: string, id: string): Promise<void> {
      await requireOwnedHabit(userId, id);
      await habits.delete(id);
    },
  };
}

export const habitService = createHabitService({ habitRepository });
