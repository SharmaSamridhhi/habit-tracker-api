import { Habit, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateHabitData {
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  tags: string[];
  reminderTime?: string;
  userId: string;
}

export interface FindManyByUserOptions {
  userId: string;
  tag?: string;
  skip: number;
  take: number;
}

export interface CountByUserOptions {
  userId: string;
  tag?: string;
}

export interface UpdateHabitData {
  title?: string;
  description?: string;
  frequency?: 'daily' | 'weekly';
  tags?: string[];
  reminderTime?: string;
}

export interface HabitRepository {
  create(data: CreateHabitData): Promise<Habit>;
  findManyByUser(options: FindManyByUserOptions): Promise<Habit[]>;
  countByUser(options: CountByUserOptions): Promise<number>;
  findById(id: string): Promise<Habit | null>;
  update(id: string, data: UpdateHabitData): Promise<Habit>;
  delete(id: string): Promise<void>;
}

function buildWhere(userId: string, tag?: string): Prisma.HabitWhereInput {
  return {
    userId,
    ...(tag ? { tags: { has: tag } } : {}),
  };
}

export const habitRepository: HabitRepository = {
  create(data) {
    return prisma.habit.create({ data });
  },
  findManyByUser({ userId, tag, skip, take }) {
    return prisma.habit.findMany({
      where: buildWhere(userId, tag),
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  },
  countByUser({ userId, tag }) {
    return prisma.habit.count({ where: buildWhere(userId, tag) });
  },
  findById(id) {
    return prisma.habit.findUnique({ where: { id } });
  },
  update(id, data) {
    return prisma.habit.update({ where: { id }, data });
  },
  async delete(id) {
    await prisma.habit.delete({ where: { id } });
  },
};
