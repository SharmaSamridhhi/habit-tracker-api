import { UserRepository } from '../repositories/user.repository';
import { createAuthService } from './auth.service';

function buildUserRepositoryMock(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'user-1',
        name: data.name,
        email: data.email,
        password: data.password,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
    ...overrides,
  };
}

describe('authService.register', () => {
  const registerInput = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'super-secret-password',
  };

  it('creates a user with a hashed (not plaintext) password', async () => {
    const userRepository = buildUserRepositoryMock();
    const authService = createAuthService({ userRepository });

    const result = await authService.register(registerInput);

    expect(userRepository.findByEmail).toHaveBeenCalledWith(registerInput.email);
    expect(userRepository.create).toHaveBeenCalledTimes(1);

    const createArg = (userRepository.create as jest.Mock).mock.calls[0][0];
    expect(createArg.password).not.toBe(registerInput.password);

    expect(result).toMatchObject({ name: registerInput.name, email: registerInput.email });
    expect(result).not.toHaveProperty('password');
  });

  it('throws a conflict error when the email is already registered', async () => {
    const userRepository = buildUserRepositoryMock({
      findByEmail: jest.fn().mockResolvedValue({
        id: 'existing-user',
        name: 'Existing User',
        email: registerInput.email,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    const authService = createAuthService({ userRepository });

    await expect(authService.register(registerInput)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
