import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const DATE_FORMAT = 'YYYY-MM-DD';

// Counts consecutive completed days ending at today, walking backwards.
// If today has no completion yet, today isn't counted as a break -- the
// day isn't over, so a streak that's intact through yesterday still shows
// as current (matching how most habit trackers report "current streak").
export function calculateStreak(completedDates: Date[]): number {
  const completedDays = new Set(completedDates.map((date) => dayjs.utc(date).format(DATE_FORMAT)));

  let cursor = dayjs.utc().startOf('day');
  if (!completedDays.has(cursor.format(DATE_FORMAT))) {
    cursor = cursor.subtract(1, 'day');
  }

  let streak = 0;
  while (completedDays.has(cursor.format(DATE_FORMAT))) {
    streak += 1;
    cursor = cursor.subtract(1, 'day');
  }

  return streak;
}
