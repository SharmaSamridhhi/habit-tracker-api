import { Habit } from '@prisma/client';
import { habitRepository, HabitRepository } from '../repositories/habit.repository';
import { CreateHabitInput, ListHabitsQuery } from '../validators/habit.validators';

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
  };
}

export const habitService = createHabitService({ habitRepository });
