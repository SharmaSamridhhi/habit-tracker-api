import { todayUTC } from './date';

describe('todayUTC', () => {
  it('returns a Date at UTC midnight', () => {
    const result = todayUTC();

    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it("matches today's UTC calendar date", () => {
    const result = todayUTC();
    const now = new Date();

    expect(result.getUTCFullYear()).toBe(now.getUTCFullYear());
    expect(result.getUTCMonth()).toBe(now.getUTCMonth());
    expect(result.getUTCDate()).toBe(now.getUTCDate());
  });
});
