import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = env.JWT_EXPIRES_IN as NonNullable<jwt.SignOptions['expiresIn']>;
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload');
  }
  return { sub: decoded.sub };
}
