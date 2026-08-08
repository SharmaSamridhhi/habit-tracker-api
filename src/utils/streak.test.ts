import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { calculateStreak } from './streak';

dayjs.extend(utc);

function daysAgo(n: number): Date {
  return dayjs.utc().startOf('day').subtract(n, 'day').toDate();
}

describe('calculateStreak', () => {
  it('returns 0 for no completions', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 when only today is completed', () => {
    expect(calculateStreak([daysAgo(0)])).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    expect(calculateStreak([daysAgo(0), daysAgo(1), daysAgo(2)])).toBe(3);
  });

  it('stops counting at the first gap', () => {
    // Completed today and yesterday, but not 2 days ago -- streak is 2.
    expect(calculateStreak([daysAgo(0), daysAgo(1), daysAgo(3)])).toBe(2);
  });

  it('still reports the streak through yesterday when today is not yet completed', () => {
    expect(calculateStreak([daysAgo(1), daysAgo(2)])).toBe(2);
  });

  it('returns 0 when the most recent completion was 2+ days ago', () => {
    expect(calculateStreak([daysAgo(2), daysAgo(3)])).toBe(0);
  });

  it('is unaffected by ordering or duplicate entries', () => {
    expect(calculateStreak([daysAgo(2), daysAgo(0), daysAgo(0), daysAgo(1)])).toBe(3);
  });
});
