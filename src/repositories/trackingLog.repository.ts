import { TrackingLog } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateTrackingLogData {
  habitId: string;
  completedOn: Date;
}

export interface TrackingLogRepository {
  create(data: CreateTrackingLogData): Promise<TrackingLog>;
}

export const trackingLogRepository: TrackingLogRepository = {
  create(data) {
    return prisma.trackingLog.create({ data });
  },
};
