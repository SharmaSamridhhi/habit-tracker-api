import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../config/prisma';
import { registerAndLogin } from '../test-utils/authTestHelpers';
import { createTestHabit } from '../test-utils/habitTestHelpers';
import { resetDb } from '../test-utils/resetDb';

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
  await prisma.$disconnect();
});

describe('POST /habits', () => {
  it('rejects a request with no auth token', async () => {
    const response = await request(app).post('/habits').send({
      title: 'Drink water',
      frequency: 'daily',
    });

    expect(response.status).toBe(401);
  });

  it('creates a habit owned by the authenticated user', async () => {
    const { token, userId } = await registerAndLogin(app);

    const response = await request(app)
      .post('/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Drink water',
        description: 'Stay hydrated',
        frequency: 'daily',
        tags: ['health'],
        reminderTime: '08:00',
      });

    expect(response.status).toBe(201);
    expect(response.body.habit).toMatchObject({
      title: 'Drink water',
      description: 'Stay hydrated',
      frequency: 'daily',
      tags: ['health'],
      reminderTime: '08:00',
      userId,
    });
  });

  it('rejects an invalid body with 400', async () => {
    const { token } = await registerAndLogin(app);

    const response = await request(app)
      .post('/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', frequency: 'yearly' });

    expect(response.status).toBe(400);
  });
});

describe('GET /habits', () => {
  it('rejects a request with no auth token', async () => {
    const response = await request(app).get('/habits');
    expect(response.status).toBe(401);
  });

  it("only returns the authenticated user's habits", async () => {
    const userA = await registerAndLogin(app, { email: 'user-a@example.com' });
    const userB = await registerAndLogin(app, { email: 'user-b@example.com' });

    await request(app)
      .post('/habits')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ title: "A's habit", frequency: 'daily' });
    await request(app)
      .post('/habits')
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ title: "B's habit", frequency: 'daily' });

    const response = await request(app)
      .get('/habits')
      .set('Authorization', `Bearer ${userA.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({ title: "A's habit", userId: userA.userId });
  });

  it('paginates results', async () => {
    const { token } = await registerAndLogin(app);

    for (const title of ['Habit 1', 'Habit 2', 'Habit 3']) {
      await request(app)
        .post('/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ title, frequency: 'daily' });
    }

    const firstPage = await request(app)
      .get('/habits')
      .query({ page: 1, limit: 2 })
      .set('Authorization', `Bearer ${token}`);

    expect(firstPage.body.data).toHaveLength(2);
    expect(firstPage.body.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const secondPage = await request(app)
      .get('/habits')
      .query({ page: 2, limit: 2 })
      .set('Authorization', `Bearer ${token}`);

    expect(secondPage.body.data).toHaveLength(1);
  });

  it('filters by tag', async () => {
    const { token } = await registerAndLogin(app);

    await request(app)
      .post('/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Run', frequency: 'daily', tags: ['fitness'] });
    await request(app)
      .post('/habits')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Read', frequency: 'daily', tags: ['learning'] });

    const response = await request(app)
      .get('/habits')
      .query({ tag: 'fitness' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({ title: 'Run' });
  });
});

const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

describe('GET /habits/:id', () => {
  it('rejects a request with no auth token', async () => {
    const response = await request(app).get(`/habits/${NON_EXISTENT_ID}`);
    expect(response.status).toBe(401);
  });

  it('returns the habit when owned by the authenticated user', async () => {
    const { token } = await registerAndLogin(app);
    const habitId = await createTestHabit(app, token, { title: 'Read a book' });

    const response = await request(app)
      .get(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.habit).toMatchObject({ id: habitId, title: 'Read a book' });
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const { token } = await registerAndLogin(app);

    const response = await request(app)
      .get(`/habits/${NON_EXISTENT_ID}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("returns 404 (not 403) for another user's habit", async () => {
    const owner = await registerAndLogin(app, { email: 'owner@example.com' });
    const intruder = await registerAndLogin(app, { email: 'intruder@example.com' });
    const habitId = await createTestHabit(app, owner.token);

    const response = await request(app)
      .get(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${intruder.token}`);

    expect(response.status).toBe(404);
  });

  it('returns 400 for a malformed id', async () => {
    const { token } = await registerAndLogin(app);

    const response = await request(app)
      .get('/habits/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

describe('PUT /habits/:id', () => {
  it('rejects a request with no auth token', async () => {
    const response = await request(app)
      .put(`/habits/${NON_EXISTENT_ID}`)
      .send({ title: 'New title' });
    expect(response.status).toBe(401);
  });

  it('updates only the provided fields', async () => {
    const { token } = await registerAndLogin(app);
    const habitId = await createTestHabit(app, token, {
      title: 'Original title',
      description: 'Original description',
    });

    const response = await request(app)
      .put(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated title' });

    expect(response.status).toBe(200);
    expect(response.body.habit).toMatchObject({
      title: 'Updated title',
      description: 'Original description',
    });
  });

  it('rejects an empty body with 400', async () => {
    const { token } = await registerAndLogin(app);
    const habitId = await createTestHabit(app, token);

    const response = await request(app)
      .put(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("returns 404 (not 403) when updating another user's habit", async () => {
    const owner = await registerAndLogin(app, { email: 'owner@example.com' });
    const intruder = await registerAndLogin(app, { email: 'intruder@example.com' });
    const habitId = await createTestHabit(app, owner.token);

    const response = await request(app)
      .put(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${intruder.token}`)
      .send({ title: 'Hijacked' });

    expect(response.status).toBe(404);
  });
});

describe('DELETE /habits/:id', () => {
  it('rejects a request with no auth token', async () => {
    const response = await request(app).delete(`/habits/${NON_EXISTENT_ID}`);
    expect(response.status).toBe(401);
  });

  it('deletes the habit and it is no longer retrievable', async () => {
    const { token } = await registerAndLogin(app);
    const habitId = await createTestHabit(app, token);

    const deleteResponse = await request(app)
      .delete(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app)
      .get(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getResponse.status).toBe(404);
  });

  it("returns 404 (not 403) when deleting another user's habit", async () => {
    const owner = await registerAndLogin(app, { email: 'owner@example.com' });
    const intruder = await registerAndLogin(app, { email: 'intruder@example.com' });
    const habitId = await createTestHabit(app, owner.token);

    const response = await request(app)
      .delete(`/habits/${habitId}`)
      .set('Authorization', `Bearer ${intruder.token}`);

    expect(response.status).toBe(404);
  });
});
