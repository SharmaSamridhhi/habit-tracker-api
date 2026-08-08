import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@habittracker.dev' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@habittracker.dev',
      password: passwordHash,
    },
  });

  const habit = await prisma.habit.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Drink 2L of water',
      description: 'Stay hydrated throughout the day',
      frequency: 'daily',
      tags: ['health'],
      userId: user.id,
    },
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  await prisma.trackingLog.upsert({
    where: {
      habitId_completedOn: {
        habitId: habit.id,
        completedOn: yesterday,
      },
    },
    update: {},
    create: {
      habitId: habit.id,
      completedOn: yesterday,
    },
  });

  console.log(`Seeded demo user (${user.email}) with habit "${habit.title}".`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
