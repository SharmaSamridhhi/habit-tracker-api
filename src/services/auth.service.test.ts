import { UserRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password';
import { verifyToken } from '../utils/jwt';
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

describe('authService.login', () => {
  const loginInput = { email: 'ada@example.com', password: 'super-secret-password' };

  async function buildStoredUser() {
    return {
      id: 'user-1',
      name: 'Ada Lovelace',
      email: loginInput.email,
      password: await hashPassword(loginInput.password),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  it('returns the user and a valid JWT for correct credentials', async () => {
    const storedUser = await buildStoredUser();
    const userRepository = buildUserRepositoryMock({
      findByEmail: jest.fn().mockResolvedValue(storedUser),
    });
    const authService = createAuthService({ userRepository });

    const result = await authService.login(loginInput);

    expect(result.user).toMatchObject({ id: storedUser.id, email: storedUser.email });
    expect(result.user).not.toHaveProperty('password');
    expect(verifyToken(result.token)).toEqual({ sub: storedUser.id });
  });

  it('rejects with 401 when the email is unknown', async () => {
    const userRepository = buildUserRepositoryMock({
      findByEmail: jest.fn().mockResolvedValue(null),
    });
    const authService = createAuthService({ userRepository });

    await expect(authService.login(loginInput)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects with 401 when the password is wrong', async () => {
    const storedUser = await buildStoredUser();
    const userRepository = buildUserRepositoryMock({
      findByEmail: jest.fn().mockResolvedValue(storedUser),
    });
    const authService = createAuthService({ userRepository });

    await expect(
      authService.login({ ...loginInput, password: 'wrong-password' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
