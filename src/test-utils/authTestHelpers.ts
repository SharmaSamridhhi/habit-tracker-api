import { Express } from 'express';
import request from 'supertest';

interface TestUser {
  name: string;
  email: string;
  password: string;
}

const defaultUser: TestUser = {
  name: 'Test User',
  email: 'test-user@example.com',
  password: 'password123',
};

export interface AuthenticatedTestUser {
  userId: string;
  token: string;
}

// Registers + logs in a user through the real HTTP endpoints so integration
// tests exercise the same auth path the API's actual clients use.
export async function registerAndLogin(
  app: Express,
  overrides: Partial<TestUser> = {},
): Promise<AuthenticatedTestUser> {
  const user = { ...defaultUser, ...overrides };

  const registerResponse = await request(app).post('/register').send(user);

  const loginResponse = await request(app)
    .post('/login')
    .send({ email: user.email, password: user.password });

  return {
    userId: registerResponse.body.user.id as string,
    token: loginResponse.body.token as string,
  };
}
