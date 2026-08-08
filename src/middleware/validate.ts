import { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

// Parses and replaces req.body/params/query with the validated (and
// coerced/defaulted) data so downstream handlers can trust its shape.
// Throws the raw ZodError, which errorHandler turns into a 400 response.
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as typeof req.params;
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query) as typeof req.query;
    }
    next();
  };
}
