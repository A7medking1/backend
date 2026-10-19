# Node.js Backend Learning Plan

Oct 19, 2026 · @said

## Overview

Goal: in \~13 weeks (1.5–2 hours a day), build a complete backend with **NestJS + MongoDB** using an AI agent, while being able to review every line it writes.

**Final stack:** Node.js (LTS) · TypeScript · NestJS · MongoDB + Mongoose · JWT · Jest · Swagger · Docker · GitHub Actions

**Golden rule:** In phases 1–3 you write the code by hand (the AI only explains, it doesn't write). From phase 4 onward the AI writes and you review. You learn the foundations first, then speed up.

| Phase | Duration | Who writes the code |  |
| --- | --- | --- | --- |
| 1. Node + TypeScript | 1.5 weeks | You |  |
| 2. Express | 1 week | You |  |
| 3. MongoDB + Mongoose | 1.5 weeks | You |  |
| 4. NestJS | 2.5 weeks | You first, then AI |  |
| 5. Auth & Security | 1.5 weeks | AI + your review |  |
| 6. Testing + Docs | 1 week | AI + your review |  |
| 7. Production & DevOps | 1.5 weeks | AI + your review |  |
| Capstone | 2 weeks | AI + your review |  |

Every phase ends with a **checkpoint**. Don't move on until you pass it.

## Phase 1: Node.js + TypeScript (1.5 weeks)

Coming from Dart, about 70% of the concepts are familiar. Focus on what's different.

**JavaScript/TypeScript:**

- `let/const`, arrow functions, destructuring, spread, optional chaining
- `==` vs `===`, and `null` vs `undefined`
- Types, interfaces, generics, union types, enums (close to Dart)
- ES Modules (`import/export`) vs CommonJS (`require`)

**Node.js core:**

- **Event loop** and Node being single-threaded: the most important concept in this whole plan
- Callbacks → Promises → `async/await`, and `Promise.all`
- Built-in modules: `fs`, `path`, `http`, `events`
- `process.env` and `dotenv`
- npm: `package.json`, scripts, dependencies vs devDependencies
- Setup: `tsx` or `ts-node` to run code, ESLint + Prettier

**Exercises:**

1. A CLI script that reads a JSON file and prints statistics.
2. An HTTP server using only the `http` module (no framework) with 3 routes.
3. Put a heavy loop inside a request handler and watch it block the whole server. This teaches you the event loop in practice.

- [ ] **Checkpoint:** You can explain why `await` inside a `for` loop can be slow, and when to use `Promise.all` instead.

## Phase 2: Express (1 week)

You won't specialize in it, but it's the foundation NestJS is built on, and most tutorials and legacy code use it.

**Topics:**

- Routing, route params, query strings
- **Middleware**, its order, and `next()`: same idea as Dio interceptors
- `req.body` and JSON parsing
- REST conventions: HTTP methods, status codes, endpoint naming
- Centralized error-handling middleware
- Validation with **Zod**
- Structure: routes → controllers → services

**Mini project:** An in-memory Todo API (no DB): CRUD + validation + error handler + logging middleware. Test it with Postman or Thunder Client.

- [ ] **Checkpoint:** You can draw the request lifecycle from arrival to response, and you know the right status code for each case (200, 201, 204, 400, 401, 403, 404, 409, 422, 500).

## Phase 3: MongoDB + Mongoose (1.5 weeks)

This is where AI makes the most mistakes: a bad schema only shows up once the data grows.

**MongoDB itself:**

- Documents and collections, and how they differ from SQL
- CRUD from **mongosh** and **MongoDB Compass** before touching Mongoose
- Run it locally with Docker, or use the MongoDB Atlas free tier

**Data modeling (most important):**

- **Embedding** vs **Referencing**: when to nest data inside a document and when to reference it
- One-to-many and many-to-many in Mongo
- **Indexes**: single, compound, unique, and how to read `explain()`

**Mongoose:**

- Schemas, validation, defaults, timestamps
- `populate`, and when it gets slow (N+1)
- Pagination: `skip/limit` vs cursor-based
- Aggregation pipeline: `$match`, `$group`, `$lookup`, `$project`
- Transactions (require a replica set)

**Exercise:** Connect the Todo API to MongoDB. Then design a schema for salla\_user (users with 3 roles, products, orders, order items) **on paper first**, before any code.

- [ ] **Checkpoint:** You can justify every embed/reference decision in your schema, and add the indexes that serve the main queries.

## Phase 4: NestJS (2.5 weeks)

Write code by hand in the first week to understand the building blocks; after that the AI starts writing.

**Concepts mapped to what you already know:**

| NestJS | Equivalent in Flutter / what you know |
| --- | --- |
| Module | Feature folder |
| Controller | Presentation layer (the endpoints) |
| Service / Provider | Repository / UseCase |
| Dependency Injection | get\_it / injectable |
| DTO + class-validator | Request models + validation |
| Pipe | Transform/validate input |
| Guard | Route guard (auth) |
| Interceptor | Dio interceptor |
| Exception filter | Global error handler |

**Topics in order:**

1. `nest new` and CLI generators (`nest g resource`)
2. Modules, DI, and how providers get injected
3. Controllers, DTOs, and a global `ValidationPipe`
4. `@nestjs/mongoose`, schemas, repositories
5. `@nestjs/config` + env validation with Joi or Zod
6. Exception filters + a unified response shape (`{ success, data, message }`)
7. Interceptors for logging and response transformation
8. Feature-first structure + a shared/common module

**Exercise:** Rebuild the Todo API in NestJS by hand. Then ask the AI to build a new module (e.g. categories) and compare its style with yours.

- [ ] **Checkpoint:** You can trace a request through NestJS: middleware → guard → interceptor → pipe → controller → service → interceptor → filter.

## Phase 5: Auth & Security (1.5 weeks)

The AI writes here, but your review must be stricter than in any other phase.

**Authentication:**

- Password hashing with `bcrypt` or `argon2` (never stored in plain text)
- JWT: short-lived access token (15 min) + long-lived refresh token
- Refresh token rotation, storing the refresh token hashed in the DB
- Logout and revoke
- `@nestjs/passport` + JWT strategy
- Phone OTP (fits your apps)

**Authorization:**

- Roles guard + a custom `@Roles()` decorator (user / driver / merchant / admin)
- Ownership checks: a user can't modify an order that isn't theirs

**Security checklist:**

- `helmet`, a properly configured CORS, `@nestjs/throttler` for rate limiting
- NoSQL injection: `whitelist: true` and `forbidNonWhitelisted` in the ValidationPipe
- No secrets in code, and `password` never returned in any response
- File uploads: limit size and type

* [ ] **Checkpoint:** Try to break your own API: expired token, wrong role, `{"$ne": null}` in the body, and a request on another user's order.

## Phase 6: Testing + API Docs (1 week)

Tests are your safety net with AI: when it changes code, the tests tell you if it broke something.

- **Unit tests** with Jest for services, mocking repositories (`@nestjs/testing`)
- **E2E tests** with Supertest against real endpoints
- **mongodb-memory-server** so tests never touch a real DB
- **Swagger** via `@nestjs/swagger`: auto-generated docs, and you can generate a Dart client for your Flutter app from it (OpenAPI Generator)
- A Postman collection or `.http` files for manual testing

* [ ] **Checkpoint:** Every module has an e2e test for the happy path plus at least two error cases, and Swagger shows all DTOs correctly.

## Phase 7: Production & DevOps (1.5 weeks)

This is an area you're already into, so make the most of it.

**Deployment:**

- Multi-stage **Dockerfile** + `docker-compose` (API + Mongo + Redis)
- VPS (Hetzner / DigitalOcean) + Nginx reverse proxy + SSL with Let's Encrypt
- PM2 or Docker restart policies
- MongoDB Atlas for production, or self-hosted Mongo with backups

**CI/CD:**

- GitHub Actions: lint → test → build image → deploy
- Hook it to your Telegram bot so the team gets notified on deploys

**Production essentials:**

- Structured logging with `pino`
- Health check endpoint (`@nestjs/terminus`)
- **Redis**: caching + **BullMQ** for background jobs (notifications, emails)
- Real-time with WebSockets (`@nestjs/websockets` + Socket.IO): key for driver and order tracking
- Push notifications via FCM from the server

* [ ] **Checkpoint:** A `git push` to main ships the API to a real server over HTTPS without you touching anything manually.

## AI Agent Workflow (from Phase 4)

The AI writes faster than you; you make better decisions than it does. Split the work on that basis.

**1. A fixed rules file (`CLAUDE.md`) in the project root, containing:**

- The stack and versions
- The exact folder structure (feature-first)
- Naming conventions
- The unified response shape and error codes
- Rules: no `any`, every endpoint has a DTO, every module has an e2e test, no secrets in code
- Run and test commands

**2. The cycle for each module:**

1. You write the spec: entities, endpoints, who can do what
2. The AI proposes the schema and endpoints **before writing code**; you approve or adjust
3. The AI writes the code + tests
4. You review using the checklist below
5. Run the tests and try it from Swagger
6. One small commit per module

**3. Review checklist:**

- [ ] Is every input validated?
- [ ] Are guards and roles correct? Is there an ownership check?
- [ ] Do indexes exist for these queries?
- [ ] No N+1, no `populate` inside a loop?
- [ ] Do errors return the right status code without leaking internal details?
- [ ] No sensitive data in the response?
- [ ] Do you understand every line? If not, ask the AI to explain

**4. When not to rely on the AI:** schema design, security decisions, and anything involving money or payments. You decide; the AI only suggests.

## Capstone and Schedule

**Capstone: a delivery backend (a version of salla\_user)**, built entirely with the AI workflow and connected to a real Flutter app.

- OTP auth + 3 roles (user / driver / merchant) + admin
- Merchants, products, categories, with search and pagination
- Orders with a status flow (pending → accepted → picked → delivered)
- Real-time driver tracking with WebSockets
- FCM notifications through BullMQ
- Admin endpoints + stats using aggregation
- Swagger + e2e tests + CI/CD + deploy to a VPS

**Weekly schedule:**

| Week | Work |
| --- | --- |
| 1 | JS/TS + Node core + event loop |
| 2 (first half) | Node exercises + raw HTTP server |
| 2 (second half) – 3 | Express + Todo API |
| 4 – 5 (first half) | MongoDB + Mongoose + salla\_user schema |
| 5 (second half) – 7 | NestJS: one week by hand, then with AI |
| 8 – 9 (first half) | Auth & Security |
| 9 (second half) – 10 | Testing + Swagger |
| 10 – 11 | Docker + CI/CD + Redis + WebSockets |
| 12 – 13 | Capstone |

**Resources (official ones are enough):**

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node.js Learn](https://nodejs.org/en/learn)
- [Express Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB University](https://learn.mongodb.com/) (free courses on data modeling)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)
- [NestJS Docs](https://docs.nestjs.com/): the docs themselves are the best course; read from Overview through Techniques
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
