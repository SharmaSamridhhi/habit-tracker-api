import { TrackingLog } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateTrackingLogData {
  habitId: string;
  completedOn: Date;
}

// Bounds how far back a single habit's logs are pulled for history/streak
// calculations -- generous enough for any realistic streak, without letting
// a years-old habit's full log history load on every request.
const MAX_LOGS_PER_HABIT = 400;

export interface TrackingLogRepository {
  create(data: CreateTrackingLogData): Promise<TrackingLog>;
  findRecentByHabit(habitId: string): Promise<TrackingLog[]>;
}

export const trackingLogRepository: TrackingLogRepository = {
  create(data) {
    return prisma.trackingLog.create({ data });
  },
  findRecentByHabit(habitId) {
    return prisma.trackingLog.findMany({
      where: { habitId },
      orderBy: { completedOn: 'desc' },
      take: MAX_LOGS_PER_HABIT,
    });
  },
};
