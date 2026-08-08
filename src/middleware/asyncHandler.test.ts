import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from './asyncHandler';

describe('asyncHandler', () => {
  const req = {} as Request;
  const res = {} as Response;

  it('calls the wrapped handler with req, res and next', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const next = jest.fn() as NextFunction;

    await asyncHandler(handler)(req, res, next);

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards a rejected promise to next', async () => {
    const error = new Error('boom');
    const handler = jest.fn().mockRejectedValue(error);
    const next = jest.fn() as NextFunction;

    await asyncHandler(handler)(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
