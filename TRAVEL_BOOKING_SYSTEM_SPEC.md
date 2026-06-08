# Travel Booking System — Full Specification & Implementation Plan

> **Status:** Core implementation complete. See legend below for per-section status.
> - ✅ **Implemented** — matches the spec
> - ⚠️ **Implemented with differences** — actual behavior noted
> - 📝 **Planned / Not implemented**

---

## 1. High-Level Architecture ✅

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ React SPA (Web)  │  │  Mobile (React   │  │  Admin Dashboard  │  │
│  │  (Next.js/React) │  │   Native)        │  │  (React SPA)      │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘  │
└───────────┼──────────────────────┼──────────────────────┼───────────┘
            │                      │                      │
            └──────────┬───────────┴───────────┬──────────┘
                       │                       │
                  ┌────▼───────────────────────▼────┐
                  │         API GATEWAY              │
                  │   (Rate limiting / Auth / CORS)  │
                  └────────────┬─────────────────────┘
                               │
                  ┌────────────▼─────────────────────┐
                  │       REST API (Express.js)       │
                  │   /api/v1/*                       │
                  │   Middleware: JWT Auth, Validation │
                  │   Controllers → Services → Repos  │
                  └────────────┬─────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌───────────┐      ┌──────────────┐      ┌───────────┐
   │ PostgreSQL │      │    Redis     │      │   Queue    │
   │ (Primary)  │      │  (Cache /    │      │ (Bull/BG)  │
   │            │      │   Sessions)  │      │ Notif/Jobs │
   └───────────┘      └──────────────┘      └───────────┘
          │                                        │
          └────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   External APIs      │
                    │  (Payment Gateway    │
                    │   SMS/Email Service) │
                    └─────────────────────┘
```
⚠️ Redis and Bull queues are included as dependencies but **not wired up** in the current implementation. All processing is synchronous.

### Technology Stack ✅

| Layer          | Technology                         |
|----------------|------------------------------------|
| Frontend       | Next.js 14 (React), Tailwind CSS   |
| Backend        | Node.js + Express.js (TypeScript)  |
| Database       | PostgreSQL 16                      |
| ORM            | Prisma                             |
| Cache          | Redis (installed, not wired)       |
| Auth           | JWT (access + refresh tokens)      |
| File Storage   | Local (no S3)                      |
| Background     | Bull (installed, not wired)        |
| API Docs       | `backend/documentation.md`         |
| Testing        | Jest + Supertest (no tests yet)    |
| Container      | Docker + docker-compose            |

### Authentication Strategy ✅

- **JWT-based**: Access token (15 min) + Refresh token (7 days, httpOnly cookie)
- **Roles**: `customer`, `travel_agent`, `admin`
- **Middleware chain**: `authenticate` → `authorize('admin')`
- Passwords hashed with bcrypt (cost factor 12)

---

## 2. Database Schema ✅

### Entity-Relationship Overview ✅

```
users ──< bookings ──< booking_details ──< booking_passengers
  │                    │
  │                    ├── flights
  │                    ├── hotels ──< hotel_rooms
  │                    └── tours
  │
  └──< notifications
  │
  └──< payments

destinations ──< flights
             ──< hotels
             ──< tours

analytics_daily (denormalized aggregation table)
```

### Table Definitions ✅

*(Schema matches implementation. See [Prisma schema](backend/prisma/schema.prisma) for authoritative field definitions.)*

> **Note:** The actual implementation uses Prisma's auto-generated UUIDs and snake_case DB column names via `@map()`. All code-level field names are **camelCase**.

#### `users` ✅
| Column        | Type         | Constraints                  |
|---------------|--------------|------------------------------|
| id            | UUID         | PK                           |
| email         | VARCHAR(255) | UNIQUE, NOT NULL, INDEX      |
| password_hash | VARCHAR(255) | NOT NULL                     |
| role          | ENUM         | customer, travel_agent, admin|
| first_name    | VARCHAR(100) | NOT NULL                     |
| last_name     | VARCHAR(100) | NOT NULL                     |
| phone         | VARCHAR(20)  |                              |
| preferences   | JSONB        | DEFAULT '{}'                 |
| is_active     | BOOLEAN      | DEFAULT true                 |
| refresh_token | TEXT         |                              |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()                |
| updated_at    | TIMESTAMPTZ  | DEFAULT NOW()                |

**Indexes:** `email` (unique), `role`

#### `destinations` ✅
| Column      | Type         | Constraints                |
|-------------|--------------|----------------------------|
| id          | UUID         | PK                         |
| name        | VARCHAR(200) | NOT NULL                   |
| country     | VARCHAR(100) | NOT NULL                   |
| description | TEXT         |                            |
| image_url   | VARCHAR(500) |                            |
| is_active   | BOOLEAN      | DEFAULT true               |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()              |

#### `flights` ✅
| Column         | Type         | Constraints                    |
|----------------|--------------|--------------------------------|
| id             | UUID         | PK                             |
| destination_id | UUID         | FK → destinations.id           |
| airline        | VARCHAR(100) | NOT NULL                       |
| flight_number  | VARCHAR(20)  | NOT NULL                       |
| departure_city | VARCHAR(100) | NOT NULL                       |
| arrival_city   | VARCHAR(100) | NOT NULL                       |
| departure_time | TIMESTAMPTZ  | NOT NULL                       |
| arrival_time   | TIMESTAMPTZ  | NOT NULL                       |
| duration_min   | INTEGER      |                                |
| seat_class     | ENUM         | economy, business, first       |
| base_price     | DECIMAL(10,2)| NOT NULL                       |
| available_seats| INTEGER      | NOT NULL                       |
| is_active      | BOOLEAN      | DEFAULT true                   |
| created_at     | TIMESTAMPTZ  | DEFAULT NOW()                  |

**Indexes:** `destination_id`, `(departure_city, arrival_city)`

#### `hotels` ✅
| Column         | Type         | Constraints              |
|----------------|--------------|--------------------------|
| id             | UUID         | PK                       |
| destination_id | UUID         | FK → destinations.id     |
| name           | VARCHAR(200) | NOT NULL                 |
| address        | TEXT         |                          |
| star_rating    | SMALLINT     | 1–5                      |
| description    | TEXT         |                          |
| image_url      | VARCHAR(500) |                          |
| is_active      | BOOLEAN      | DEFAULT true             |
| created_at     | TIMESTAMPTZ  | DEFAULT NOW()            |

**Index:** `destination_id`

#### `hotel_rooms` ✅
| Column          | Type          | Constraints                 |
|-----------------|---------------|-----------------------------|
| id              | UUID          | PK                          |
| hotel_id        | UUID          | FK → hotels.id              |
| room_type       | VARCHAR(100)  | NOT NULL                    |
| price_per_night | DECIMAL(10,2) | NOT NULL                    |
| max_guests      | SMALLINT      | NOT NULL                    |
| total_rooms     | INTEGER       | NOT NULL                    |
| available_rooms | INTEGER       | NOT NULL                    |
| amenities       | JSONB         |                             |
| is_active       | BOOLEAN       | DEFAULT true                |
| created_at      | TIMESTAMPTZ   | DEFAULT NOW()               |

**Index:** `hotel_id`

#### `tours` ✅
| Column           | Type          | Constraints              |
|------------------|---------------|--------------------------|
| id               | UUID          | PK                       |
| destination_id   | UUID          | FK → destinations.id     |
| name             | VARCHAR(200)  | NOT NULL                 |
| description      | TEXT          |                          |
| duration_days    | SMALLINT      | NOT NULL                 |
| price_per_person | DECIMAL(10,2) | NOT NULL                 |
| max_capacity     | INTEGER       | NOT NULL                 |
| available_slots  | INTEGER       | NOT NULL                 |
| includes         | JSONB         |                          |
| itinerary        | JSONB         |                          |
| is_active        | BOOLEAN       | DEFAULT true             |
| created_at       | TIMESTAMPTZ   | DEFAULT NOW()            |

**Index:** `destination_id`

#### `bookings` ✅
| Column       | Type         | Constraints                              |
|--------------|--------------|------------------------------------------|
| id           | UUID         | PK                                       |
| user_id      | UUID         | FK → users.id, NOT NULL                  |
| booking_type | ENUM         | flight, hotel, tour, package             |
| status       | ENUM         | pending, confirmed, cancelled, completed |
| total_amount | DECIMAL(10,2)| NOT NULL                                 |
| currency     | VARCHAR(3)   | DEFAULT 'USD'                            |
| reference_id | VARCHAR(20)  | UNIQUE, NOT NULL                         |
| notes        | TEXT         |                                          |
| created_at   | TIMESTAMPTZ  | DEFAULT NOW()                            |
| updated_at   | TIMESTAMPTZ  | DEFAULT NOW()                            |

**Indexes:** `user_id`, `reference_id` (unique), `status`, `created_at`

**Reference ID format:** `TBK-{YYYYMMDD}-{8 random hex}` (e.g., `TBK-20260605-A3F8K2P1`)

#### `booking_details` ✅
| Column         | Type          | Constraints                   |
|----------------|---------------|-------------------------------|
| id             | UUID          | PK                            |
| booking_id     | UUID          | FK → bookings.id              |
| item_type      | ENUM          | flight, hotel, tour           |
| item_id        | UUID          | polymorphic FK                |
| check_in_date  | DATE          |                               |
| check_out_date | DATE          |                               |
| quantity       | INTEGER       | DEFAULT 1                     |
| unit_price     | DECIMAL(10,2) | NOT NULL                      |
| subtotal       | DECIMAL(10,2) | NOT NULL                      |
| created_at     | TIMESTAMPTZ   | DEFAULT NOW()                 |

**Index:** `booking_id`

#### `booking_passengers` ✅
| Column           | Type         | Constraints               |
|------------------|--------------|---------------------------|
| id               | UUID         | PK                        |
| booking_detail_id| UUID         | FK → booking_details.id   |
| first_name       | VARCHAR(100) | NOT NULL                  |
| last_name        | VARCHAR(100) | NOT NULL                  |
| document_type    | VARCHAR(50)  |                           |
| document_number  | VARCHAR(50)  |                           |
| seat_class       | VARCHAR(20)  |                           |
| created_at       | TIMESTAMPTZ  | DEFAULT NOW()             |

**Index:** `booking_detail_id`

#### `payments` ✅
| Column         | Type          | Constraints                    |
|----------------|---------------|--------------------------------|
| id             | UUID          | PK                             |
| booking_id     | UUID          | FK → bookings.id               |
| amount         | DECIMAL(10,2) | NOT NULL                       |
| currency       | VARCHAR(3)    | DEFAULT 'USD'                  |
| payment_method | ENUM          | card, cash_on_arrival          |
| payment_status | ENUM          | pending, paid, failed, refunded|
| invoice_number | VARCHAR(30)   | UNIQUE                         |
| paid_at        | TIMESTAMPTZ   |                                |
| gateway_response| JSONB        |                                |
| created_at     | TIMESTAMPTZ   | DEFAULT NOW()                  |

**Indexes:** `booking_id`, `invoice_number` (unique), `payment_status`

#### `notifications` ✅
| Column     | Type         | Constraints                    |
|------------|--------------|--------------------------------|
| id         | UUID         | PK                             |
| user_id    | UUID         | FK → users.id                  |
| type       | ENUM         | booking_confirmation,          |
|            |              | cancellation, payment_receipt, |
|            |              | reminder, promotional          |
| channel    | ENUM         | email, sms, in_app             |
| subject    | VARCHAR(200) |                                |
| message    | TEXT         | NOT NULL                       |
| is_read    | BOOLEAN      | DEFAULT false                  |
| sent_at    | TIMESTAMPTZ  |                                |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()                  |

**Indexes:** `user_id`, `is_read`, `created_at`

#### `analytics_daily` ✅
| Column               | Type          | Constraints                   |
|----------------------|---------------|-------------------------------|
| id                   | UUID          | PK                            |
| date                 | DATE          | NOT NULL, UNIQUE              |
| total_bookings       | INTEGER       | DEFAULT 0                     |
| total_revenue        | DECIMAL(12,2) | DEFAULT 0                     |
| total_users          | INTEGER       | DEFAULT 0                     |
| popular_destination  | VARCHAR(255)  |                                |
| bookings_by_type     | JSONB         |                                |
| revenue_by_type      | JSONB         |                                |
| created_at           | TIMESTAMPTZ   | DEFAULT NOW()                 |

**Index:** `date` (unique)

### Entity Relationship Summary ✅

```
users 1────N bookings
bookings 1────N booking_details
booking_details 1────N booking_passengers

flights 1────N booking_details (item_type='flight')
hotels 1────N hotel_rooms
hotel_rooms 1────N booking_details (item_type='hotel')
tours 1────N booking_details (item_type='tour')

destinations 1────N flights
destinations 1────N hotels
destinations 1────N tours

users 1────N notifications
bookings 1────N payments
```

---

## 3. API Endpoints

Base URL: `/api/v1`

> ⚠️ **Important:** The actual API uses **camelCase** in request/response bodies (Prisma defaults), not snake_case as shown in this spec. For example, `first_name` is `firstName` in the live API.

### Authentication ✅

| Method | Endpoint               | Description              | Auth     | Status |
|--------|------------------------|--------------------------|----------|--------|
| POST   | /auth/register         | Register new user        | No       | ✅ |
| POST   | /auth/login            | Login                    | No       | ✅ |
| POST   | /auth/logout           | Logout                   | Yes      | ✅ |
| POST   | /auth/refresh          | Refresh access token     | No*      | ✅ |

**POST /auth/register**
```json
// Request (camelCase in actual API)
{
  "email": "jane@example.com",
  "password": "SecureP@ss1",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "customer"
}

// Response 201
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "customer",
      "phone": "+1234567890",
      "isActive": true,
      "createdAt": "2026-06-05T10:30:00Z",
      "updatedAt": "2026-06-05T10:30:00Z"
    },
    "accessToken": "eyJhbG..."
  }
}
```

**POST /auth/login**
```json
// Request
{
  "email": "jane@example.com",
  "password": "SecureP@ss1"
}

// Response 200
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "jane@example.com", "role": "customer", "firstName": "Jane", "lastName": "Doe" },
    "accessToken": "eyJhbG..."
  }
}
```

### Users ✅ (all implemented)

| Method | Endpoint          | Description               | Auth       |
|--------|-------------------|---------------------------|------------|
| GET    | /users/me         | Get current user profile  | Yes        |
| PATCH  | /users/me         | Update profile            | Yes        |
| GET    | /users/me/bookings| List user's bookings      | Yes        |
| GET    | /users            | List all users (admin)    | Admin      |
| GET    | /users/:id        | Get user by ID (admin)    | Admin      |
| PATCH  | /users/:id        | Update user (admin)       | Admin      |

**PATCH /users/me**
```json
// Request
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1987654321",
  "preferences": {
    "currency": "EUR",
    "language": "en",
    "notifications": true
  }
}
```

### Destinations ✅ (all implemented)

| Method | Endpoint             | Description              | Auth  |
|--------|----------------------|--------------------------|-------|
| GET    | /destinations        | List destinations        | No    |
| GET    | /destinations/:id    | Get destination details  | No    |
| POST   | /destinations        | Create destination       | Admin |
| PUT    | /destinations/:id    | Update destination       | Admin |
| DELETE | /destinations/:id    | Soft-delete destination  | Admin |

### Flights ✅ (all implemented)

| Method | Endpoint              | Description              | Auth       |
|--------|-----------------------|--------------------------|------------|
| GET    | /flights              | Search flights           | No         |
| GET    | /flights/:id          | Get flight details       | No         |
| POST   | /flights              | Create flight            | Admin      |
| PUT    | /flights/:id          | Update flight            | Admin      |
| DELETE | /flights/:id          | Soft-delete flight       | Admin      |
| PATCH  | /flights/:id/seats    | Update seat availability | Admin      |

**GET /flights?departure_city=NYC&arrival_city=Tokyo&date=2026-07-15&seat_class=economy**
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "airline": "Delta",
      "flightNumber": "DL275",
      "departureCity": "New York",
      "arrivalCity": "Tokyo",
      "departureTime": "2026-07-15T23:30:00Z",
      "arrivalTime": "2026-07-16T18:45:00Z",
      "durationMin": 735,
      "seatClass": "economy",
      "basePrice": 850.00,
      "availableSeats": 42,
      "destination": { "id": "uuid", "name": "Tokyo" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

### Hotels ✅ (all implemented)

| Method | Endpoint                | Description               | Auth       |
|--------|-------------------------|---------------------------|------------|
| GET    | /hotels                 | Search hotels             | No         |
| GET    | /hotels/:id             | Get hotel details+rooms   | No         |
| POST   | /hotels                 | Create hotel              | Admin      |
| PUT    | /hotels/:id             | Update hotel              | Admin      |
| DELETE | /hotels/:id             | Soft-delete hotel         | Admin      |

### Tours ✅ (all implemented)

| Method | Endpoint              | Description              | Auth       |
|--------|-----------------------|--------------------------|------------|
| GET    | /tours                | Search tours             | No         |
| GET    | /tours/:id            | Get tour details         | No         |
| POST   | /tours                | Create tour              | Admin      |
| PUT    | /tours/:id            | Update tour              | Admin      |
| DELETE | /tours/:id            | Soft-delete tour         | Admin      |

### Bookings ✅ (all implemented)

| Method | Endpoint                    | Description                | Auth        |
|--------|-----------------------------|----------------------------|-------------|
| POST   | /bookings                   | Create a new booking       | Yes         |
| GET    | /bookings                   | List bookings (user/admin) | Yes         |
| GET    | /bookings/:id               | Get booking details        | Yes         |
| PATCH  | /bookings/:id/status        | Update booking status      | Admin/Agent |
| POST   | /bookings/:id/cancel        | Cancel booking             | Yes         |

### Payments ✅ (all implemented)

| Method | Endpoint                       | Description                | Auth       |
|--------|--------------------------------|----------------------------|------------|
| POST   | /payments/:id/process          | Process payment (mock)     | Yes        |
| GET    | /payments/:id                  | Get payment details        | Yes        |
| GET    | /payments/invoice/:invoice_num | Download invoice           | Yes        |

### Admin — Analytics ✅ (all implemented)

| Method | Endpoint                       | Description                  | Auth  |
|--------|--------------------------------|------------------------------|-------|
| GET    | /admin/analytics/overview      | Dashboard overview stats     | Admin |
| GET    | /admin/analytics/bookings      | Bookings over time           | Admin |
| GET    | /admin/analytics/revenue       | Revenue over time            | Admin |
| GET    | /admin/analytics/popular       | Popular destinations         | Admin |

### Notifications ✅ (all implemented)

| Method | Endpoint                       | Description                  | Auth  |
|--------|--------------------------------|------------------------------|-------|
| GET    | /notifications                 | List user notifications      | Yes   |
| PATCH  | /notifications/:id/read        | Mark notification as read    | Yes   |
| POST   | /notifications/read-all        | Mark all as read             | Yes   |

---

## 4. Key Workflows ✅

> **Note:** All core booking flows are implemented (create, cancel with inventory restore, payment processing, refund). See [backend documentation](backend/documentation.md) for full endpoint details.

### 4.1 Flight Booking Flow (Step-by-Step) ✅

```
1. SEARCH
   User visits /flights
   → GET /api/v1/flights?departure_city=NYC&arrival_city=Tokyo&date=2026-07-15
   → Returns available flights with seat counts

2. SELECT
   User clicks on flight DL275
   → GET /api/v1/flights/:id
   → Returns full details with destination

3. BOOK
   User clicks "Book Now"
   → POST /api/v1/bookings
   → Server:
      a. Validates flight exists, seats available
      b. BEGIN transaction
      c. Creates booking (status='pending')
      d. Creates booking details + passengers
      e. Decrements availableSeats
      f. Creates payment (status='pending')
      g. COMMIT
   → Response: booking + payment reference

4. PAYMENT
   User proceeds to checkout
   → POST /api/v1/payments/:id/process
   → Server:
      a. Updates payment to 'paid'
      b. Updates booking to 'confirmed'
      c. Creates receipt notification
   → Response: confirmation

5. CONFIRMATION
   → GET /api/v1/bookings/:id returns full booking
   → Invoice at GET /api/v1/payments/invoice/:invoiceNumber
```

### 4.2 Hotel Booking Flow ✅

```
1. SEARCH → GET /api/v1/hotels?... (includes room availability)
2. SELECT HOTEL → GET /api/v1/hotels/:id
3. SELECT ROOM → User picks room type
4. BOOK → POST /api/v1/bookings (with checkInDate/checkOutDate)
   → Server calculates nights, decrements availableRooms
5. PAYMENT → Cash on arrival: confirmed immediately. Card: pending.
```

### 4.3 Cancel Booking Flow ✅

```
1. POST /api/v1/bookings/:id/cancel
   → Server:
      a. Verifies ownership/permission
      b. BEGIN transaction
      c. Sets booking status to 'cancelled'
      d. Restores inventory (+seats/+rooms/+slots)
      e. Refunds paid payments
      f. COMMIT
```

### 4.4 Admin: Add New Flight ✅

```
1. Admin fills form
2. POST /api/v1/flights (JWT with role=admin)
3. Server validates and creates flight
4. Flight appears in search results immediately
```

### 4.5 Payment-on-Arrival / Cash Flow ✅

```
1. User selects "cash_on_arrival" during booking
2. POST /bookings → payment_method='cash_on_arrival'
3. Server:
   - Creates payment record with status='pending'
   - Sets booking status to 'confirmed' (immediate)
   - Generates invoice
4. ⚠️ Admin mark-as-paid on arrival is not implemented
```

---

## 5. Code Structure ✅

### Backend (Node.js + Express + TypeScript) ✅

```
backend/
├── src/
│   ├── index.ts                    # Entry point, server bootstrap
│   ├── app.ts                      # Express app setup, middleware
│   ├── config/
│   │   ├── index.ts                # Env config loader
│   │   ├── database.ts             # Prisma client singleton
│   │   └── logger.ts               # Winston logger
│   ├── middleware/
│   │   ├── authenticate.ts         # JWT verification
│   │   ├── authorize.ts            # Role-based guard
│   │   ├── validate.ts             # Zod schema validation
│   │   ├── rateLimiter.ts          # Rate limiting
│   │   ├── errorHandler.ts         # Global error handler
│   │   └── asyncHandler.ts         # Async route wrapper
│   ├── modules/
│   │   ├── auth/        (controller, service, routes, validation)
│   │   ├── users/       (controller, service, routes, validation)
│   │   ├── flights/     (controller, service, routes, validation)
│   │   ├── hotels/      (controller, service, routes, validation)
│   │   ├── tours/       (controller, service, routes, validation)
│   │   ├── bookings/    (controller, service, routes, validation)
│   │   ├── payments/    (controller, service, routes, validation)
│   │   ├── notifications/ (controller, service, routes, validation)
│   │   ├── destinations/  (controller, service, routes, validation)
│   │   └── admin/       (controller, service, routes, validation)
│   ├── utils/
│   │   ├── AppError.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── reference.ts            # TBK + INV generators
│   │   └── pagination.ts
│   └── types/
│       └── index.ts                # Shared interfaces
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   └── seed.ts                     # Seed script (also in prisma/)
├── documentation.md
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env
```

📝 **Not implemented from spec:** `jobs/` directory (Bull queues), `tests/` directory, `redis.ts`, `invoice.ts`, `pricing.ts`, `validators.ts` (client-side), dedicated hook files.

### Frontend (Next.js 14 + Tailwind CSS) ✅

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Home with search tabs
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── search/page.tsx
│   │   ├── flights/page.tsx          # Search flights
│   │   ├── flights/[id]/page.tsx     # Flight detail
│   │   ├── hotels/page.tsx           # Search hotels
│   │   ├── hotels/[id]/page.tsx      # Hotel detail
│   │   ├── tours/page.tsx            # Search tours
│   │   ├── tours/[id]/page.tsx       # Tour detail
│   │   ├── booking/[id]/page.tsx     # Confirmation
│   │   ├── booking/checkout/[bookingId]/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── profile/bookings/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── bookings/page.tsx
│   │       ├── destinations/page.tsx
│   │       ├── flights/page.tsx
│   │       ├── hotels/page.tsx
│   │       ├── tours/page.tsx
│   │       └── users/page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── AutocompleteInput.tsx
│   │   ├── layout/ (Header, Footer)
│   │   └── search/ (SearchView, SearchFilters, SearchResults)
│   ├── lib/
│   │   ├── api.ts                    # Axios + JWT interceptor
│   │   ├── auth.tsx                  # Auth context/provider
│   │   └── utils.ts                  # formatCurrency, etc.
│   └── types/
│       └── index.ts
├── tailwind.config.ts
├── next.config.js
├── package.json
└── .env.local
```

---

## 6. Security & Constraints

### Security Checklist
- [x] Password hashing: bcrypt (cost 12)
- [x] JWT: HS256, short-lived access tokens (15 min)
- [x] Refresh tokens: stored in httpOnly cookie
- [x] Input validation: Zod schemas on every endpoint
- [x] SQL injection: prevented by Prisma parameterized queries
- [x] XSS: React auto-escapes
- [x] Rate limiting: 100 req/min per IP (general), 100 req/min (auth)
- [x] Role-based access: middleware enforces route-level guards
- [ ] 📝 CSRF: SameSite cookies (partial)
- [ ] 📝 Inventory race conditions: row-level locking (transaction only, no explicit FOR UPDATE)
- [ ] 📝 Audit logging: not implemented

### Performance Constraints ✅
- Pagination: required on all list endpoints (default 20, max 100)
- Booking creation: wrapped in a database transaction
- 📝 Full-text search indexes: not implemented
- 📝 Redis caching: not wired up

### Error Response Format ✅
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Only 1 seat available, requested 2"
  }
}
```

### Pagination Response Format ✅
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 7. Implementation Status

| Phase | Tasks | Status |
|-------|-------|--------|
| **Phase 1: Foundation** | Project scaffolding, Prisma schema, JWT auth, Docker | ✅ Complete |
| **Phase 2: Core Search** | Flights/Hotels/Tours CRUD + search/filter, destinations | ✅ Complete |
| **Phase 3: Booking Engine** | Transactional booking, inventory mgmt, reference IDs | ✅ Complete |
| **Phase 4: Payments** | Mock gateway, invoice generation, cash-on-arrival | ✅ Complete |
| **Phase 5: Frontend** | All pages, responsive UI, autocomplete, booking flow | ✅ Complete |
| **Phase 6: Admin Dashboard** | Analytics, CRUD management, user/booking admin | ✅ Complete |
| **Phase 7: Notifications** | In-app notification system, mark read | ✅ Complete |
| **Phase 8: Polish** | Seed script, documentation, autocomplete, filter fixes | ✅ Complete |

---

## 8. Prisma Schema (Quick Reference) ✅

See [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) for the authoritative schema. All 13 models are implemented matching the table definitions in Section 2 above.

---

*End of Specification Document — Last updated: June 2026*
