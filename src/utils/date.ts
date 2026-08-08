import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

// Returns today's calendar date (UTC) at midnight, matching the precision of
// the tracking_logs.completedOn DATE column so "today" is unambiguous
// regardless of the server's local timezone.
export function todayUTC(): Date {
  return dayjs.utc().startOf('day').toDate();
}
