import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
