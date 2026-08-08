import { prisma } from '../config/prisma';

// Deletes rows in FK-safe order so integration tests start from a clean,
// predictable database state without needing to recreate the schema.
export async function resetDb(): Promise<void> {
  await prisma.trackingLog.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.user.deleteMany();
}
