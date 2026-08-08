import { User } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

export const userRepository: UserRepository = {
  findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },
  create(data) {
    return prisma.user.create({ data });
  },
};

export type PublicUser = Omit<User, 'password'>;

export function toPublicUser(user: User): PublicUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}
