# Habit Tracker API

A backend-only **Personal Habit Tracking & Streak Management REST API**. Users
register, log in, create habits, mark them complete for the day, and view a
7-day history with a running streak.

Built with Node.js, TypeScript (strict), Express, PostgreSQL + Prisma, JWT
auth, and a full Jest/Supertest test suite.

## Table of contents

- [Tech stack](#tech-stack)
- [Quick start (Docker)](#quick-start-docker)
- [Local development (without full Docker)](#local-development-without-full-docker)
- [Environment variables](#environment-variables)
- [Data model](#data-model)
- [Authentication](#authentication)
- [API documentation](#api-documentation)
- [API reference & examples](#api-reference--examples)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Design notes](#design-notes)
- [npm scripts](#npm-scripts)

## Tech stack

| Area             | Choice                                                           |
| ---------------- | ---------------------------------------------------------------- |
| Language         | TypeScript (strict mode)                                         |
| Framework        | Express                                                          |
| Database         | PostgreSQL + Prisma                                              |
| Auth             | JWT (`jsonwebtoken`) + `bcryptjs`                                |
| Validation       | Zod                                                              |
| Date handling    | Day.js (UTC plugin)                                              |
| Testing          | Jest + Supertest (unit + real-DB integration tests)              |
| Docs             | OpenAPI 3.0 via `swagger-jsdoc` + Swagger UI, Postman collection |
| Containerization | Docker + Docker Compose                                          |
| CI               | GitHub Actions (lint, typecheck, test)                           |

## Quick start (Docker)

The fastest way to get the whole stack (API + Postgres) running:

```bash
cp .env.example .env
docker compose up --build
```

This starts Postgres, applies migrations, and runs the API at
`http://localhost:3000`. Swagger UI is at `http://localhost:3000/docs`.

To seed some demo data (a user + habit) into the running database:

```bash
npm install
npm run prisma:seed
```

(The seed script connects using your local `.env`, so it works whether
Postgres is running in Docker or natively — see [Environment
variables](#environment-variables).)

## Local development (without full Docker)

This is the faster loop for active development: only Postgres runs in
Docker, and the API runs natively with hot reload.

```bash
npm install
cp .env.example .env
docker compose up -d db      # Postgres only
npm run prisma:migrate       # create/apply migrations
npm run prisma:seed          # optional: seed demo data
npm run dev                  # http://localhost:3000, reloads on save
```

> **Port note:** the `db` service publishes Postgres on host port **5434**,
> not 5432 — this avoids clashing with a Postgres already installed locally
> (Homebrew, Postgres.app, etc). `.env.example` already points at 5434.

## Environment variables

See [`.env.example`](.env.example) for the full list with defaults. The
notable ones:

| Variable               | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`         | Postgres connection string (Prisma)                             |
| `JWT_SECRET`           | Secret used to sign JWTs — use a long random value in prod      |
| `JWT_EXPIRES_IN`       | Token lifetime (default `1d`)                                   |
| `BCRYPT_SALT_ROUNDS`   | bcrypt cost factor (default `10`)                               |
| `RATE_LIMIT_MAX`       | Max requests per user per window on `/habits/*` (default `100`) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default `3600000` = 1 hour)            |

`.env.test` holds dummy, non-secret values used by the test suite and CI
(a separate `habit_tracker_test` database, auto-created by
[`docker/init-test-db.sql`](docker/init-test-db.sql) the first time the `db`
container starts).

## Data model

Three related tables, defined in [`prisma/schema.prisma`](prisma/schema.prisma):

```
User (1) ──< Habit (1) ──< TrackingLog
```

- **User** — `id, name, email (unique), password (bcrypt hash), createdAt, updatedAt`
- **Habit** — `id, title, description?, frequency (daily|weekly), tags[], reminderTime?, userId, createdAt, updatedAt`
- **TrackingLog** — `id, habitId, completedOn (date), createdAt`

The "one tracking entry per habit per day" rule is enforced with a
**database-level unique constraint** on `(habitId, completedOn)` — not just
application logic — so it holds even under concurrent requests. The service
layer catches the resulting Postgres unique-violation and turns it into a
clean `409` response.

All habit and tracking-log queries are scoped to `req.userId` (from the JWT),
and `onDelete: Cascade` means deleting a user or habit cleans up its
dependent rows.

## Authentication

1. `POST /register` to create an account.
2. `POST /login` to receive a JWT.
3. Send it on every subsequent request to a protected route:

```
Authorization: Bearer <token>
```

All `/habits*` routes require this header (enforced by `requireAuth`
middleware). Missing, malformed, or expired/invalid tokens get a `401`.

## API documentation

- **Interactive Swagger UI**: `http://localhost:3000/docs`
- **Raw OpenAPI 3.0 spec (JSON)**: `http://localhost:3000/docs.json`
- **Postman collection**: [`postman/habit-tracker-api.postman_collection.json`](postman/habit-tracker-api.postman_collection.json)
  — import it, set the `baseUrl` collection variable if not using
  `localhost:3000`, then run **Auth → Login** once; its test script
  automatically stores the returned JWT in the `token` collection variable
  so every other request picks it up.

## API reference & examples

| Method | Endpoint              | Auth | Description                        |
| ------ | --------------------- | :--: | ---------------------------------- |
| GET    | `/health`             |      | Health check                       |
| POST   | `/register`           |      | Register a new user                |
| POST   | `/login`              |      | Authenticate and get a JWT         |
| POST   | `/habits`             |  ✅  | Create a new habit                 |
| GET    | `/habits`             |  ✅  | List habits (pagination + `?tag=`) |
| GET    | `/habits/:id`         |  ✅  | Get a single habit                 |
| PUT    | `/habits/:id`         |  ✅  | Partially update a habit           |
| DELETE | `/habits/:id`         |  ✅  | Delete a habit                     |
| POST   | `/habits/:id/track`   |  ✅  | Mark the habit done for today      |
| GET    | `/habits/:id/history` |  ✅  | Last 7 days + current streak       |

Full request/response schemas are in Swagger; a few examples:

<details>
<summary><strong>POST /register</strong></summary>

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"super-secret-password"}'
```

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "b7ce60b7-c94d-4827-aa55-91465eb0c8ca",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "createdAt": "2026-08-08T16:38:25.407Z",
    "updatedAt": "2026-08-08T16:38:25.407Z"
  }
}
```

</details>

<details>
<summary><strong>POST /login</strong></summary>

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com","password":"super-secret-password"}'
```

```json
{
  "message": "Login successful",
  "user": { "id": "b7ce60b7-...", "name": "Ada Lovelace", "email": "ada@example.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

</details>

<details>
<summary><strong>POST /habits</strong></summary>

```bash
curl -X POST http://localhost:3000/habits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Drink 2L of water","frequency":"daily","tags":["health"],"reminderTime":"08:00"}'
```

```json
{
  "habit": {
    "id": "d045b92f-722c-4dfa-b61b-c99023570bbb",
    "title": "Drink 2L of water",
    "description": null,
    "frequency": "daily",
    "tags": ["health"],
    "reminderTime": "08:00",
    "userId": "b7ce60b7-...",
    "createdAt": "2026-08-08T16:51:59.188Z",
    "updatedAt": "2026-08-08T16:51:59.188Z"
  }
}
```

</details>

<details>
<summary><strong>POST /habits/:id/track</strong> (second call same day → 409)</summary>

```bash
curl -X POST http://localhost:3000/habits/$HABIT_ID/track \
  -H "Authorization: Bearer $TOKEN"
# => 201 { "trackingLog": { "id": "...", "habitId": "...", "completedOn": "2026-08-08", "createdAt": "..." } }

curl -X POST http://localhost:3000/habits/$HABIT_ID/track \
  -H "Authorization: Bearer $TOKEN"
# => 409 { "error": { "message": "Habit already tracked for today" } }
```

</details>

<details>
<summary><strong>GET /habits/:id/history</strong></summary>

```bash
curl http://localhost:3000/habits/$HABIT_ID/history -H "Authorization: Bearer $TOKEN"
```

```json
{
  "history": [
    { "date": "2026-08-02", "completed": false },
    { "date": "2026-08-03", "completed": false },
    { "date": "2026-08-04", "completed": false },
    { "date": "2026-08-05", "completed": false },
    { "date": "2026-08-06", "completed": false },
    { "date": "2026-08-07", "completed": false },
    { "date": "2026-08-08", "completed": true }
  ],
  "streak": 1
}
```

</details>

Errors are always shaped as `{ "error": { "message": "...", "details"?: [...] } }`
— `details` is present for `400` validation errors (one entry per invalid field).

## Testing

```bash
docker compose up -d db     # tests need a real Postgres (habit_tracker_test db)
npm test                    # run once
npm run test:watch          # watch mode
npm run test:coverage       # with coverage report
```

The suite mixes:

- **Unit tests** for pure logic and services (password hashing, JWT sign/verify,
  streak calculation, service-layer business rules against mocked repositories).
- **Integration tests** (Supertest) that exercise the real HTTP routes against
  the actual `habit_tracker_test` Postgres database, reset between tests via
  a `resetDb()` helper.

## Project structure

```
src/
  config/         env validation (zod), Prisma client singleton, Swagger config
  routes/         Express routers + OpenAPI JSDoc annotations
  controllers/    thin HTTP layer — parses req, calls a service, shapes the response
  services/       business logic (ownership checks, pagination, streaks, ...)
  repositories/   Prisma queries, behind a typed interface for testability
  middleware/     auth, validation, error handling, rate limiting
  validators/     Zod schemas per resource
  utils/          AppError, JWT, password hashing, date/streak helpers
  test-utils/     shared test helpers (resetDb, registerAndLogin, createTestHabit)
prisma/
  schema.prisma   data model
  migrations/     versioned SQL migrations
  seed.ts         demo data seed script
postman/          Postman collection
.github/workflows/ CI (lint, typecheck, test)
```

Each layer only talks to the one below it (`controller → service → repository
→ Prisma`), which is what makes the service layer unit-testable with a mocked
repository instead of a real database.

## Design notes

A few decisions worth calling out, since they're not obvious from skimming
individual files:

- **404, not 403, for other users' resources.** Fetching, updating, deleting,
  or tracking a habit you don't own returns `404 Not Found` — identical to a
  habit that doesn't exist at all. This prevents an attacker from
  distinguishing "not found" from "not yours" and enumerating valid habit ids.
- **Login doesn't reveal which field was wrong.** An unknown email and a
  wrong password both return the same `401 "Invalid email or password"`.
- **The one-track-per-day rule lives in the database**, not just application
  code — a unique constraint on `(habitId, completedOn)`, so it can't be
  bypassed by a race condition between two concurrent requests.
- **Streaks don't break just because today isn't logged yet.** If a habit
  was completed yesterday and the day before, but not yet today, the streak
  still reports as 2 — the day isn't over. See `calculateStreak` in
  [`src/utils/streak.ts`](src/utils/streak.ts).
- **Day boundaries are pinned to UTC** (via Day.js's UTC plugin) rather than
  the server's local timezone, so "today" means the same thing regardless of
  where the process happens to run.
- **Rate limiting is per-user, not per-IP** — it's keyed by `req.userId` and
  only makes sense after `requireAuth`, so it's mounted on the `/habits`
  routes specifically.

## npm scripts

| Script                            | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Start the API with hot reload (`tsx watch`)    |
| `npm run build`                   | Compile TypeScript to `dist/`                  |
| `npm start`                       | Run the compiled build (`node dist/server.js`) |
| `npm test`                        | Run the Jest test suite                        |
| `npm run test:watch`              | Run tests in watch mode                        |
| `npm run test:coverage`           | Run tests with a coverage report               |
| `npm run lint` / `lint:fix`       | ESLint                                         |
| `npm run format` / `format:check` | Prettier                                       |
| `npm run typecheck`               | `tsc --noEmit`                                 |
| `npm run prisma:migrate`          | Create/apply a dev migration                   |
| `npm run prisma:deploy`           | Apply migrations (production/CI)               |
| `npm run prisma:seed`             | Seed demo data                                 |
| `npm run prisma:studio`           | Open Prisma Studio (DB browser GUI)            |

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged
files) and a full typecheck before every commit.
