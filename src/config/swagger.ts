import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';

const definition: swaggerJsdoc.OAS3Definition = {
  openapi: '3.0.3',
  info: {
    title: 'Habit Tracker API',
    version: '1.0.0',
    description:
      'Personal Habit Tracking & Streak Management REST API. Register, log in, create habits, ' +
      'track daily completions, and view history/streaks. Protected routes require ' +
      '`Authorization: Bearer <token>` using the JWT returned by POST /login.',
  },
  servers: [{ url: '/', description: 'Current server' }],
  tags: [
    { name: 'Health', description: 'Service status' },
    { name: 'Auth', description: 'Registration and login' },
    { name: 'Habits', description: 'Habit CRUD, daily tracking, and history' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT returned by POST /login, sent as: Authorization: Bearer <token>',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Ada Lovelace' },
          email: { type: 'string', format: 'email', example: 'ada@example.com' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Habit: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Drink 2L of water' },
          description: { type: 'string', nullable: true, example: 'Stay hydrated' },
          frequency: { type: 'string', enum: ['daily', 'weekly'] },
          tags: { type: 'array', items: { type: 'string' }, example: ['health'] },
          reminderTime: { type: 'string', nullable: true, example: '08:00' },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TrackingLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          habitId: { type: 'string', format: 'uuid' },
          completedOn: { type: 'string', format: 'date' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Validation failed' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing, malformed, or invalid/expired token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found (or not owned by the authenticated user)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationError: {
        description: 'Invalid request body, params, or query',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
};

// __dirname resolves to src/config in dev (tsx) and dist/config in the
// compiled build, so this glob picks up the JSDoc comments either way.
export const swaggerSpec = swaggerJsdoc({
  definition,
  apis: [path.join(__dirname, '../routes/*.{ts,js}')],
});
