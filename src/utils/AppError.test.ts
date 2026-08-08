import { AppError } from './AppError';

describe('AppError', () => {
  it('sets the given status code, message and details', () => {
    const error = new AppError(422, 'Something went wrong', { field: 'email' });

    expect(error.statusCode).toBe(422);
    expect(error.message).toBe('Something went wrong');
    expect(error.details).toEqual({ field: 'email' });
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it.each([
    ['unauthorized', 401] as const,
    ['forbidden', 403] as const,
    ['notFound', 404] as const,
  ])('%s() creates an error with status %d and a default message', (factory, statusCode) => {
    const error = AppError[factory]();
    expect(error.statusCode).toBe(statusCode);
    expect(error.message.length).toBeGreaterThan(0);
  });

  it('badRequest() creates a 400 error with the given message', () => {
    const error = AppError.badRequest('Invalid input', { field: 'title' });
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'title' });
  });

  it('conflict() creates a 409 error with the given message', () => {
    const error = AppError.conflict('Email already registered');
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Email already registered');
  });
});
