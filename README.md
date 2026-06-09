# Travel Booking System

Full-stack travel booking platform for flights, hotels, and tours. Built with Next.js 14, Express.js, TypeScript, and PostgreSQL.

## Architecture

```
frontend/       Next.js 14 (React) + Tailwind CSS   → Port 3000
backend/        Express.js + TypeScript + Prisma     → Port 4000
database/       PostgreSQL 16                         → Port 5432
```

- JWT authentication (access + refresh tokens)
- Zod validation on all API inputs
- Mock payment gateway (card / cash-on-arrival)
- Transactional booking engine with inventory management

## Quick Start

### Backend

```bash
cd backend
npm install
# Set up .env (see .env.example)
npx prisma migrate dev
npm run seed         # Seeds 3 users, 3 destinations, 5 flights, 6 hotels, 6 tours
npm run dev          # Starts on port 4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # Starts on port 3000
```

## Default Credentials

| Email | Role | Password |
|---|---|---|
| admin@travel.com | admin | Password123! |
| agent@travel.com | travel_agent | Password123! |
| customer@example.com | customer | Password123! |

## Documentation

- **[Backend API Docs](backend/documentation.md)** — All 60+ endpoints with request/response shapes
- **[User Flow Diagrams](frontend/userflow.md)** — Site architecture, guest/auth/admin flows, payment flow
- **[Technical Spec](TRAVEL_BOOKING_SYSTEM_SPEC.md)** — Original specification with implementation status

## Routes

### Public
`/flights`, `/hotels`, `/tours` — search and browse; `/[type]/[id]` — detail pages

### Protected (login required)
`/booking/checkout/[id]` — booking flow; `/booking/[id]` — confirmation; `/profile` — settings; `/profile/bookings` — my bookings; `/notifications`

### Admin / Agent
`/admin` — analytics dashboard; `/admin/bookings`, `/admin/flights`, `/admin/hotels`, `/admin/tours` — CRUD (admin+agent); `/admin/destinations`, `/admin/users` — CRUD (admin only); `/admin/api-keys` — API Integration (keys + documentation tab)

## Key Features

- Search with filters, autocomplete, and pagination
- Booking with inventory decrement (transactional)
- Cancellation with inventory restoration + refund
- Mock card payment (succeed/fail) and cash-on-arrival
- Invoice generation
- In-app notifications
- Admin analytics (bookings/revenue trends, popular destinations)
- Full CRUD management for all entities
- Agent trust tier system (new → trusted after 5 approved items)
- SeatEditor/RoomEditor components for flight seat class and hotel room management
- API key system for third-party integration (ta_ prefixed, sha256 hashed)
- Public API endpoints (/public/*) with X-API-Key authentication
- File upload (images, multer-based) with proper error handling
- ConfirmDialog component for destructive action confirmation
- API Integration page with live documentation and code examples (JS/Python/cURL)
