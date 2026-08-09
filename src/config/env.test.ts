import { parseEnv } from './env';

const validEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a-test-secret',
};

describe('parseEnv', () => {
  it('applies defaults for optional variables', () => {
    const result = parseEnv(validEnv);

    expect(result).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      JWT_EXPIRES_IN: '1d',
      BCRYPT_SALT_ROUNDS: 10,
      RATE_LIMIT_WINDOW_MS: 3_600_000,
      RATE_LIMIT_MAX: 100,
    });
  });

  it('coerces numeric string variables', () => {
    const result = parseEnv({ ...validEnv, PORT: '4000', BCRYPT_SALT_ROUNDS: '12' });

    expect(result.PORT).toBe(4000);
    expect(result.BCRYPT_SALT_ROUNDS).toBe(12);
  });

  it('throws a readable error listing every missing/invalid field', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL.*JWT_SECRET/s);
  });

  it('throws when NODE_ENV is not one of the allowed values', () => {
    expect(() => parseEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
