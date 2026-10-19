# Node.js Backend Learning Plan (Express-first)

Oct 19, 2026 · @said · **Revised Oct 19, 2026:** Express is the main track (the company works with Express). NestJS moved to the very end as an optional bonus after becoming a pro.

## Overview

Goal: in \~13 weeks (1.5–2 hours a day), build a complete, production-grade backend with **Express + MongoDB** using an AI agent, while being able to review every line it writes.

**Final stack:** Node.js (LTS) · TypeScript · **Express 5** · MongoDB + Mongoose · Zod · JWT · Jest + Supertest · Swagger · Docker · GitHub Actions

**Golden rule:** In phases 1–3 you write the code by hand (the AI only explains, it doesn't write). In phase 4 you write first, then the AI. From phase 5 onward the AI writes and you review.

| Phase | Duration | Who writes the code |
| --- | --- | --- |
| 1. Node + TypeScript | 1.5 weeks | You |
| 2. Express Fundamentals | 1.5 weeks | You |
| 3. MongoDB + Mongoose (with Express) | 1.5 weeks | You |
| 4. Professional Express Architecture | 2 weeks | You first, then AI |
| 5. Auth & Security | 1.5 weeks | AI + your review |
| 6. Testing + Docs | 1 week | AI + your review |
| 7. Production & DevOps | 1.5 weeks | AI + your review |
| Capstone (Express) | 2 weeks | AI + your review |
| Bonus: NestJS | 2.5 weeks | Only after the capstone |

Every phase ends with a **checkpoint**. Don't move on until you pass it.

## Phase 1: Node.js + TypeScript (1.5 weeks)

Express is just a library on top of Node, so this phase is the foundation for everything. Coming from Dart, about 70% of the concepts are familiar. Focus on what's different.

**JavaScript/TypeScript:**

- `let/const`, arrow functions, destructuring, spread, optional chaining
- `==` vs `===`, and `null` vs `undefined`
- Types, interfaces, generics, union types, enums (close to Dart)
- ES Modules (`import/export`) vs CommonJS (`require`): a lot of company Express code may still use `require`, so be able to read both

**Node.js core:**

- **Event loop** and Node being single-threaded: the most important concept in this whole plan
- Callbacks → Promises → `async/await`, and `Promise.all`
- Built-in modules: `fs`, `path`, `http`, `events`
- `process.env` and `dotenv`
- npm: `package.json`, scripts, dependencies vs devDependencies
- Setup: `tsx` to run code, ESLint + Prettier

**Exercises:**

1. A CLI script that reads a JSON file and prints statistics.
2. An HTTP server using only the `http` module (no framework) with 3 routes.
3. Put a heavy loop inside a request handler and watch it block the whole server. This teaches you the event loop in practice.

- [ ] **Checkpoint:** You can explain why `await` inside a `for` loop can be slow, and when to use `Promise.all` instead.

## Phase 2: Express Fundamentals (1.5 weeks)

This is now the core of the plan. Understand Express deeply, not just how to copy routes.

**Topics:**

- `express()`, `app.listen`, and how Express wraps Node's `http` module
- Routing, route params, query strings, `express.Router()` and mounting routers
- **Middleware**: what it is, its order, `next()`, app-level vs router-level vs route-level: same idea as Dio interceptors
- `req` and `res` in depth: `req.body`, `req.params`, `req.query`, `req.headers`, `res.status().json()`
- `express.json()` and body parsing
- REST conventions: HTTP methods, status codes, endpoint naming, versioning (`/api/v1`)
- Error handling: the 4-argument error middleware, a custom `AppError` class, async errors (handled automatically in Express 5, and how it was done with wrappers in Express 4, since legacy code uses that)
- Validation with **Zod** as a reusable `validate(schema)` middleware
- Third-party middleware: `morgan`, `cors`, `helmet` (intro)
- Structure: routes → controllers → services

**Mini project:** An in-memory Todo API (no DB): CRUD + Zod validation + centralized error handler + logging middleware + 404 handler. Test it with Postman or Thunder Client.

- [ ] **Checkpoint:** You can draw the request lifecycle in Express from arrival to response (including what happens when a middleware throws), and you know the right status code for each case (200, 201, 204, 400, 401, 403, 404, 409, 422, 500).

## Phase 3: MongoDB + Mongoose with Express (1.5 weeks)

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

- Connecting from an Express app (one connection at startup, graceful shutdown)
- Schemas, validation, defaults, timestamps, TypeScript types for models
- Handling Mongoose errors in the error middleware (duplicate key → 409, cast error → 400, validation → 422)
- `populate`, and when it gets slow (N+1)
- Pagination: `skip/limit` vs cursor-based, plus filtering and sorting from query strings
- Aggregation pipeline: `$match`, `$group`, `$lookup`, `$project`
- Transactions (require a replica set)

**Exercise:** Connect the Todo API to MongoDB. Then design a schema for salla\_user (users with 3 roles, products, orders, order items) **on paper first**, before any code.

- [ ] **Checkpoint:** You can justify every embed/reference decision in your schema, and add the indexes that serve the main queries.

## Phase 4: Professional Express Architecture (2 weeks)

Express gives you no structure, so every company invents its own. This phase is about building the structure a senior would build. Write by hand in the first week; after that the AI starts writing.

**Topics in order:**

1. Feature-first folder structure (`modules/users/`, `modules/orders/`) + a `common/` folder
2. Layers: routes → controllers → services → repositories (data access), and why each layer exists
3. Config: one `config` module, env validation with Zod at startup (the app refuses to start with a missing env)
4. A unified response shape (`{ success, data, message }`) and unified error codes
5. Async error handling, custom error classes, and never leaking stack traces in production
6. Structured logging with `pino` + a request ID per request
7. Simple dependency injection without a framework (passing dependencies in, factory functions), so code stays testable
8. Reusable middlewares: `validate`, `authenticate`, `authorize`, `paginate`
9. Reading legacy Express code: CommonJS, callbacks, and Express 4 patterns, since company code may look like this

**Exercise:** Refactor the Todo API into this architecture by hand. Then ask the AI to build a new module (e.g. categories) following the same structure and compare its style with yours.

- [ ] **Checkpoint:** You can explain why each layer exists, add a new module without breaking the structure, and trace a request through every file it touches.

## Phase 5: Auth & Security (1.5 weeks)

The AI writes here, but your review must be stricter than in any other phase.

**Authentication:**

- Password hashing with `bcrypt` or `argon2` (never stored in plain text)
- JWT: short-lived access token (15 min) + long-lived refresh token
- Refresh token rotation, storing the refresh token hashed in the DB
- Logout and revoke
- An `authenticate` middleware that verifies the JWT and sets `req.user` (with typed `Request` in TypeScript)
- Phone OTP (fits your apps)

**Authorization:**

- An `authorize(...roles)` middleware (user / driver / merchant / admin)
- Ownership checks: a user can't modify an order that isn't theirs

**Security checklist:**

- `helmet`, a properly configured CORS, `express-rate-limit` for rate limiting
- NoSQL injection: strict Zod schemas that strip unknown keys, never pass `req.body` straight into a query
- Body size limits on `express.json()`
- No secrets in code, and `password` never returned in any response
- File uploads with `multer`: limit size and type

* [ ] **Checkpoint:** Try to break your own API: expired token, wrong role, `{"$ne": null}` in the body, and a request on another user's order.

## Phase 6: Testing + API Docs (1 week)

Tests are your safety net with AI: when it changes code, the tests tell you if it broke something.

- Separate `app` from `server` (export the app without calling `listen`) so tests can import it
- **Unit tests** with Jest for services, mocking repositories
- **Integration/E2E tests** with Supertest against real endpoints
- **mongodb-memory-server** so tests never touch a real DB
- **Swagger** via `swagger-ui-express` + OpenAPI generated from Zod schemas: you can generate a Dart client for your Flutter app from it (OpenAPI Generator)
- A Postman collection or `.http` files for manual testing

* [ ] **Checkpoint:** Every module has an integration test for the happy path plus at least two error cases, and Swagger shows all request/response schemas correctly.

## Phase 7: Production & DevOps (1.5 weeks)

This is an area you're already into, so make the most of it.

**Deployment:**

- Multi-stage **Dockerfile** + `docker-compose` (API + Mongo + Redis)
- VPS (Hetzner / DigitalOcean) + Nginx reverse proxy + SSL with Let's Encrypt
- PM2 (cluster mode to use all CPU cores) or Docker restart policies
- Graceful shutdown (close the server and DB connection on `SIGTERM`)
- MongoDB Atlas for production, or self-hosted Mongo with backups

**CI/CD:**

- GitHub Actions: lint → test → build image → deploy
- Hook it to your Telegram bot so the team gets notified on deploys

**Production essentials:**

- Structured logging with `pino`
- Health check endpoint (`/health` that checks the DB and Redis)
- `compression`, and tuning `trust proxy` behind Nginx
- **Redis**: caching + **BullMQ** for background jobs (notifications, emails)
- Real-time with **Socket.IO** attached to the Express server: key for driver and order tracking
- Push notifications via FCM from the server

* [ ] **Checkpoint:** A `git push` to main ships the API to a real server over HTTPS without you touching anything manually.

## AI Agent Workflow (from Phase 4)

The AI writes faster than you; you make better decisions than it does. Split the work on that basis.

**1. A fixed rules file (`CLAUDE.md`) in the project root, containing:**

- The stack and versions
- The exact folder structure (feature-first)
- Naming conventions
- The unified response shape and error codes
- Rules: no `any`, every endpoint has a Zod schema, every module has an integration test, no secrets in code
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
- [ ] Are auth/authorize middlewares correct? Is there an ownership check?
- [ ] Do indexes exist for these queries?
- [ ] No N+1, no `populate` inside a loop?
- [ ] Do errors return the right status code without leaking internal details?
- [ ] No sensitive data in the response?
- [ ] Do you understand every line? If not, ask the AI to explain

**4. When not to rely on the AI:** schema design, security decisions, and anything involving money or payments. You decide; the AI only suggests.

## Capstone and Schedule

**Capstone: a delivery backend in Express (a version of salla\_user)**, built entirely with the AI workflow and connected to a real Flutter app.

- OTP auth + 3 roles (user / driver / merchant) + admin
- Merchants, products, categories, with search and pagination
- Orders with a status flow (pending → accepted → picked → delivered)
- Real-time driver tracking with Socket.IO
- FCM notifications through BullMQ
- Admin endpoints + stats using aggregation
- Swagger + integration tests + CI/CD + deploy to a VPS

**Weekly schedule:**

| Week | Work |
| --- | --- |
| 1 | JS/TS + Node core + event loop |
| 2 (first half) | Node exercises + raw HTTP server |
| 2 (second half) – 3 | Express fundamentals + Todo API |
| 4 – 5 (first half) | MongoDB + Mongoose + salla\_user schema |
| 5 (second half) – 7 (first half) | Professional Express architecture |
| 7 (second half) – 8 | Auth & Security |
| 9 | Testing + Swagger |
| 10 – 11 (first half) | Docker + CI/CD + Redis + Socket.IO |
| 11 (second half) – 13 | Capstone |

## Bonus: NestJS (after the capstone, optional)

Only after you're comfortable with professional Express. NestJS is built on top of Express, so by then most of it will just be "Express with structure and decorators".

| NestJS | What you'll already know from Express |
| --- | --- |
| Module | Feature folder |
| Controller | Router + controller |
| Service / Provider | Service |
| Dependency Injection | The manual DI from phase 4 |
| DTO + class-validator / Pipe | Zod `validate` middleware |
| Guard | `authenticate` / `authorize` middleware |
| Interceptor | Response/logging middleware |
| Exception filter | Error-handling middleware |

**Exercise:** Rebuild one module of the capstone in NestJS and compare.

**Resources (official ones are enough):**

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node.js Learn](https://nodejs.org/en/learn)
- [Express Guide](https://expressjs.com/en/guide/routing.html) + [Express 5 migration guide](https://expressjs.com/en/guide/migrating-5.html)
- [Express production best practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [MongoDB University](https://learn.mongodb.com/) (free courses on data modeling)
- [Mongoose Docs](https://mongoosejs.com/docs/guide.html)
- [Zod Docs](https://zod.dev/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [NestJS Docs](https://docs.nestjs.com/) (bonus phase only)
