# AGENTS.md

## Project

Two independent apps in one repo (not a monorepo).

```
backend/   Express.js + TypeScript + Prisma → :4000
frontend/  Next.js 14 App Router + Tailwind  → :3000
```

## Quick start

```bash
cd backend && npm install && npx prisma migrate dev && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```
**Backend order matters:** `migrate dev` → `seed` → `dev`.

## Non-obvious commands

| Scope | Command | Why it matters |
|-------|---------|----------------|
| backend | `npm run seed` (aliased as `db:seed`) | seeds 3 users, destinations, flights, hotels, tours |
| backend | `npm run db:push` | applies schema without migration files — use `db:migrate` for history |
| frontend | `npm run build` | also runs typecheck (no separate `tsc` step) |
| frontend | `npm run lint` | uses eslint-config-next + @typescript-eslint |

## Architecture gotchas

- **Rate limiters & search cache** are in-memory Maps — reset on restart, don't work across clusters
- **Prisma** uses `@map()` on every field — DB columns are snake_case, TS fields are camelCase
- **All PKs** are UUIDs with `@db.Uuid`
- **Booking inventory** uses transactional `decrement` but **no `SELECT FOR UPDATE`** — race condition under concurrency
- **All pages** are `'use client'` — no SSR data fetching
- **Auth:** JWT access (Bearer) + refresh (httpOnly cookie) + CSRF double-submit cookie. Refresh token accepted from **both** cookie and request body
- **Controllers** must use `asyncHandler` wrapper (convention, not enforced at type level)
- **Error format** is always `{ success: false, error: { code, message } }` via `AppError` class

## Environment file setup

`.env` and `.env.local` are gitignored. Reference copies (`backend/.env.example`, `frontend/.env.local.example`) are tracked.

### Backend `.env` (JWT secrets enforced in prod — `process.exit(1)` if missing)
| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/travel_booking?schema=public` | |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | dev fallbacks | **must** be set in production |
| `CORS_ORIGIN` | `http://localhost:3000` | no validation — `*` disables CORS |
| `REDIS_URL` | `redis://localhost:6379` | used for job queues (bull), not rate limiting |

### Frontend `.env.local`
| Variable | Default |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` |

## Seeded credentials

| Email | Role | Password |
|---|---|---|
| admin@travel.com | admin | Password123! |
| agent@travel.com | travel_agent | Password123! |
| customer@example.com | customer | Password123! |

## Past fixes (regression prevention)

- **Auth role escalation** — registration now restricts `role` to `customer` only
- **Invoice authz** — checks `userId` against requesting user
- **Upload authz** — requires `admin` or `travel_agent` role
- **Booking updateStatus** — checks ownership; agents can't update other users' bookings
- **Cancel seat restore** — counts passengers per seat class (not first passenger's class only)
- **SearchView filter collision** — all price/duration params map to distinct snake keys
- **Search autocomplete abort** — `get()` now accepts `AbortSignal`; abort actually cancels HTTP
- **Tour error code** — `INSUFFICIENT_SLOTS` (was `INSUFFICIENT_SEATS`)
- **Login order** — `isActive` check before password comparison
- **Admin N+1** — `getPopularDestinations` uses batched `findMany`
- **Unguarded JSON.parse** — all sessionStorage restores wrapped in try/catch
- **Validation schemas** — `listFlightsQuerySchema`, `listHotelsQuerySchema`, `listToursQuerySchema`, `listDestinationsQuerySchema`, `markReadSchema` all wired to routes (were defined but unused)
- **ExcludeSensitive** — extracted to shared `src/utils/user.ts` (was duplicated in auth + user services)
- **Dead code** — `buildFuzzyCondition` removed from search service
