import {
  PublicUser,
  toPublicUser,
  userRepository,
  UserRepository,
} from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { signToken } from '../utils/jwt';
import { comparePassword, hashPassword } from '../utils/password';
import { LoginInput, RegisterInput } from '../validators/auth.validators';

interface AuthServiceDeps {
  userRepository: UserRepository;
}

export function createAuthService({ userRepository: users }: AuthServiceDeps) {
  return {
    async register(input: RegisterInput): Promise<PublicUser> {
      const existingUser = await users.findByEmail(input.email);
      if (existingUser) {
        throw AppError.conflict('An account with this email already exists');
      }

      const password = await hashPassword(input.password);
      const user = await users.create({
        name: input.name,
        email: input.email,
        password,
      });

      return toPublicUser(user);
    },

    async login(input: LoginInput): Promise<{ user: PublicUser; token: string }> {
      const user = await users.findByEmail(input.email);
      if (!user) {
        throw AppError.unauthorized('Invalid email or password');
      }

      const isPasswordValid = await comparePassword(input.password, user.password);
      if (!isPasswordValid) {
        throw AppError.unauthorized('Invalid email or password');
      }

      const token = signToken({ sub: user.id });
      return { user: toPublicUser(user), token };
    },
  };
}

export const authService = createAuthService({ userRepository });
