import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { signToken, verifyToken } from './jwt';

describe('jwt utils', () => {
  it('signs a token that verifyToken can decode back to the original payload', () => {
    const token = signToken({ sub: 'user-123' });

    const decoded = verifyToken(token);

    expect(decoded).toEqual({ sub: 'user-123' });
  });

  it('produces a token signed with the configured secret and expiry', () => {
    const token = signToken({ sub: 'user-123' });

    const decoded = jwt.decode(token, { complete: true });

    expect(decoded?.payload).toMatchObject({ sub: 'user-123' });
    expect(decoded?.payload).toHaveProperty('exp');
  });

  it('throws for a token signed with a different secret', () => {
    const foreignToken = jwt.sign({ sub: 'user-123' }, 'a-different-secret');

    expect(() => verifyToken(foreignToken)).toThrow();
  });

  it('throws for an expired token', () => {
    const expiredToken = jwt.sign({ sub: 'user-123' }, env.JWT_SECRET, { expiresIn: -10 });

    expect(() => verifyToken(expiredToken)).toThrow();
  });

  it('throws for a malformed token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});
