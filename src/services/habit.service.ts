import { Habit, Prisma, TrackingLog } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { habitRepository, HabitRepository } from '../repositories/habit.repository';
import {
  trackingLogRepository,
  TrackingLogRepository,
} from '../repositories/trackingLog.repository';
import { AppError } from '../utils/AppError';
import { todayUTC } from '../utils/date';
import { calculateStreak } from '../utils/streak';
import {
  CreateHabitInput,
  ListHabitsQuery,
  UpdateHabitInput,
} from '../validators/habit.validators';

dayjs.extend(utc);

const HISTORY_DAYS = 7;
const DATE_FORMAT = 'YYYY-MM-DD';

export interface HabitHistoryDay {
  date: string;
  completed: boolean;
}

export interface HabitHistory {
  history: HabitHistoryDay[];
  streak: number;
}

interface HabitServiceDeps {
  habitRepository: HabitRepository;
  trackingLogRepository: TrackingLogRepository;
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

export function createHabitService({
  habitRepository: habits,
  trackingLogRepository: trackingLogs,
}: HabitServiceDeps) {
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

    async trackHabit(userId: string, id: string): Promise<TrackingLog> {
      await requireOwnedHabit(userId, id);

      try {
        return await trackingLogs.create({ habitId: id, completedOn: todayUTC() });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw AppError.conflict('Habit already tracked for today');
        }
        throw error;
      }
    },

    async getHistory(userId: string, id: string): Promise<HabitHistory> {
      await requireOwnedHabit(userId, id);

      const logs = await trackingLogs.findRecentByHabit(id);
      const completedDays = new Set(
        logs.map((log) => dayjs.utc(log.completedOn).format(DATE_FORMAT)),
      );

      const history: HabitHistoryDay[] = Array.from({ length: HISTORY_DAYS }, (_, index) => {
        const date = dayjs
          .utc()
          .startOf('day')
          .subtract(HISTORY_DAYS - 1 - index, 'day')
          .format(DATE_FORMAT);
        return { date, completed: completedDays.has(date) };
      });

      return {
        history,
        streak: calculateStreak(logs.map((log) => log.completedOn)),
      };
    },
  };
}

export const habitService = createHabitService({ habitRepository, trackingLogRepository });
