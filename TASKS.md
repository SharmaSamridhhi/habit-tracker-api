# Project Work Units

Tracks the breakdown of the Habit Tracking & Streak Management REST API case study
into small, independently-committable units of work. Checked off as each unit lands.

Stack: Node.js + TypeScript (strict) + Express + PostgreSQL + Prisma + JWT/bcrypt + Jest/Supertest + Docker.

- [x] 1. Bootstrap TypeScript Express project (tooling, lint, test config, folder structure, health check)
- [x] 2. Docker, PostgreSQL and Prisma setup (Dockerfile, docker-compose, schema, migration)
- [x] 3. Env config validation and core middleware (error handling, logging, security headers)
- [x] 4. User registration — `POST /register`
- [x] 5. Login with JWT — `POST /login`
- [ ] 6. JWT auth middleware protecting habit routes
- [ ] 7. Habit create & list — `POST /habits`, `GET /habits` (pagination, tag filter)
- [ ] 8. Habit detail/update/delete — `GET/PUT/DELETE /habits/:id`
- [ ] 9. Daily habit tracking — `POST /habits/:id/track` (one entry/day rule)
- [ ] 10. History endpoint & streak calculation — `GET /habits/:id/history`
- [ ] 11. Per-user rate limiting middleware (bonus)
- [ ] 12. OpenAPI/Swagger documentation (bonus)
- [ ] 13. README + Postman collection
- [ ] 14. GitHub Actions CI workflow (lint, typecheck, test)
- [ ] 15. Final polish and test coverage review

## Workflow

Each unit lands as one atomic, conventional commit (`feat:`, `chore:`, `test:`, `docs:`, `ci:`).
Tests are written alongside/before implementation (TDD). After each unit, changes are staged
and a suggested commit message is proposed — commits and pushes are performed by the repo owner.
