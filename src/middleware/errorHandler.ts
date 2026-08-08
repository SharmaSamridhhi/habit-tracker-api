import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

interface ErrorResponseBody {
  error: {
    message: string;
    details?: unknown;
  };
}

function toResponse(statusCode: number, message: string, details?: unknown): ErrorResponseBody {
  return details === undefined ? { error: { message } } : { error: { message, details } };
}

// Express identifies error-handling middleware by arity, so all four
// parameters must stay even though `next` is unused.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(toResponse(err.statusCode, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(400).json(toResponse(400, 'Validation failed', details));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json(toResponse(409, 'A record with these details already exists'));
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json(toResponse(404, 'Record not found'));
      return;
    }
  }

  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(500).json(toResponse(500, 'Internal server error'));
}
