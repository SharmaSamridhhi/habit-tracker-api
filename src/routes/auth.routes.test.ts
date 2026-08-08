import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../config/prisma';
import { resetDb } from '../test-utils/resetDb';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe('POST /register', () => {
  it('registers a new user and never returns the password', async () => {
    const response = await request(app).post('/register').send({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'super-secret-password',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: 'Grace Hopper',
      email: 'grace@example.com',
    });
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('persists a bcrypt hash, not the plaintext password', async () => {
    await request(app).post('/register').send({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'super-secret-password',
    });

    const stored = await prisma.user.findUniqueOrThrow({
      where: { email: 'grace@example.com' },
    });

    expect(stored.password).not.toBe('super-secret-password');
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/register').send({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'super-secret-password',
    });

    const response = await request(app).post('/register').send({
      name: 'Someone Else',
      email: 'grace@example.com',
      password: 'another-password',
    });

    expect(response.status).toBe(409);
  });

  it('rejects an invalid payload with 400 and does not create a user', async () => {
    const response = await request(app).post('/register').send({
      name: '',
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.length).toBeGreaterThan(0);

    const count = await prisma.user.count();
    expect(count).toBe(0);
  });
});

describe('POST /login', () => {
  const credentials = { email: 'grace@example.com', password: 'super-secret-password' };

  beforeEach(async () => {
    await request(app)
      .post('/register')
      .send({ name: 'Grace Hopper', ...credentials });
  });

  it('logs in with correct credentials and returns a usable JWT', async () => {
    const response = await request(app).post('/login').send(credentials);

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: credentials.email });
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.split('.')).toHaveLength(3);
  });

  it('rejects an unknown email with 401', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: 'nobody@example.com', password: credentials.password });

    expect(response.status).toBe(401);
  });

  it('rejects a wrong password with 401', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: credentials.email, password: 'wrong-password' });

    expect(response.status).toBe(401);
  });

  it('rejects an invalid payload with 400', async () => {
    const response = await request(app).post('/login').send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
  });
});
