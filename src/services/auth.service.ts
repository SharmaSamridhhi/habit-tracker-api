import {
  PublicUser,
  toPublicUser,
  userRepository,
  UserRepository,
} from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/password';
import { RegisterInput } from '../validators/auth.validators';

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
  };
}

export const authService = createAuthService({ userRepository });
