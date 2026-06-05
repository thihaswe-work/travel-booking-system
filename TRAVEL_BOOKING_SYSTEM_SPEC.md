# Travel Booking System — Full Specification & Implementation Plan

---

## 1. High-Level Architecture

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

### Technology Stack

| Layer          | Technology                         |
|----------------|------------------------------------|
| Frontend       | Next.js 14 (React), Tailwind CSS   |
| Backend        | Node.js + Express.js (TypeScript)  |
| Database       | PostgreSQL 16                      |
| ORM            | Prisma                             |
| Cache          | Redis                              |
| Auth           | JWT (access + refresh tokens)      |
| File Storage   | AWS S3 / Local disk                |
| Background     | Bull (Redis-backed job queue)      |
| API Docs       | Swagger / OpenAPI 3.0              |
| Testing        | Jest + Supertest (backend)         |
| Container      | Docker + docker-compose            |

### Authentication Strategy

- **JWT-based**: Access token (15 min) + Refresh token (7 days, httpOnly cookie)
- **Roles**: `customer`, `travel_agent`, `admin`
- **Middleware chain**: `authenticate` → `authorize('admin')`
- Passwords hashed with bcrypt (cost factor 12)

---

## 2. Database Schema

### Entity-Relationship Overview

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

### Table Definitions

#### `users`
| Column        | Type         | Constraints                  |
|---------------|--------------|------------------------------|
| id            | UUID         | PK, default gen_random_uuid()|
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

#### `destinations`
| Column      | Type         | Constraints                |
|-------------|--------------|----------------------------|
| id          | UUID         | PK                         |
| name        | VARCHAR(200) | NOT NULL                   |
| country     | VARCHAR(100) | NOT NULL                   |
| description | TEXT         |                            |
| image_url   | VARCHAR(500) |                            |
| is_active   | BOOLEAN      | DEFAULT true               |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()              |

#### `flights`
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

**Indexes:** `destination_id`, `(departure_city, arrival_city)`, `(departure_time, arrival_time)`

#### `hotels`
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

#### `hotel_rooms`
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

#### `tours`
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

#### `bookings`
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

**Reference ID format:** `TBK-{YYYYMMDD}-{8 random alphanumeric}` (e.g., `TBK-20260605-A3F8K2P1`)

#### `booking_details`
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

#### `booking_passengers`
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

#### `payments`
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

#### `notifications`
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

#### `analytics_daily`
| Column               | Type          | Constraints                   |
|----------------------|---------------|-------------------------------|
| id                   | UUID          | PK                            |
| date                 | DATE          | NOT NULL, UNIQUE              |
| total_bookings       | INTEGER       | DEFAULT 0                     |
| total_revenue        | DECIMAL(12,2) | DEFAULT 0                     |
| total_users          | INTEGER       | DEFAULT 0                     |
| popular_destination  | UUID          | FK → destinations.id          |
| bookings_by_type     | JSONB         | {"flight": 12, "hotel": 8}    |
| revenue_by_type      | JSONB         | {"flight": 5200, "hotel": 3400}|
| created_at           | TIMESTAMPTZ   | DEFAULT NOW()                 |

**Index:** `date` (unique)

### Entity Relationship Summary

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

### Authentication

| Method | Endpoint               | Description              | Auth     |
|--------|------------------------|--------------------------|----------|
| POST   | /auth/register         | Register new user        | No       |
| POST   | /auth/login            | Login                    | No       |
| POST   | /auth/logout           | Logout                   | Yes      |
| POST   | /auth/refresh          | Refresh access token     | Yes*     |

**POST /auth/register**
```json
// Request
{
  "email": "jane@example.com",
  "password": "SecureP@ss1",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+1234567890",
  "role": "customer"
}

// Response 201
{
  "user": {
    "id": "uuid",
    "email": "jane@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "role": "customer"
  },
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG..."
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
  "user": { "id": "uuid", "email": "jane@example.com", "role": "customer" },
  "access_token": "eyJhbG...",
  "refresh_token": "eyJhbG...",
  "expires_in": 900
}
```

### Users

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
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1987654321",
  "preferences": {
    "currency": "EUR",
    "language": "en",
    "notifications": { "email": true, "sms": false }
  }
}

// Response 200
{
  "id": "uuid",
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1987654321",
  "preferences": { "currency": "EUR", ... },
  "role": "customer"
}
```

### Destinations

| Method | Endpoint             | Description              | Auth  |
|--------|----------------------|--------------------------|-------|
| GET    | /destinations        | List destinations        | No    |
| GET    | /destinations/:id    | Get destination details  | No    |
| POST   | /destinations        | Create destination       | Admin |
| PUT    | /destinations/:id    | Update destination       | Admin |
| DELETE | /destinations/:id    | Soft-delete destination  | Admin |

**GET /destinations?country=Japan&is_active=true&page=1&limit=20**
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "name": "Tokyo",
      "country": "Japan",
      "description": "Vibrant capital of Japan...",
      "image_url": "https://cdn.example.com/tokyo.jpg",
      "is_active": true
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "total_pages": 1 }
}
```

### Flights

| Method | Endpoint              | Description              | Auth       |
|--------|-----------------------|--------------------------|------------|
| GET    | /flights              | Search flights           | No         |
| GET    | /flights/:id          | Get flight details       | No         |
| POST   | /flights              | Create flight            | Admin      |
| PUT    | /flights/:id          | Update flight            | Admin      |
| DELETE | /flights/:id          | Soft-delete flight       | Admin      |
| PATCH  | /flights/:id/seats    | Update seat availability | Admin      |

**GET /flights?departure_city=NYC&arrival_city=Tokyo&date=2026-07-15&seat_class=economy&sort=price_asc&page=1&limit=20**
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "airline": "Delta",
      "flight_number": "DL275",
      "departure_city": "New York (JFK)",
      "arrival_city": "Tokyo (NRT)",
      "departure_time": "2026-07-15T23:30:00Z",
      "arrival_time": "2026-07-16T18:45:00Z",
      "duration_min": 735,
      "seat_class": "economy",
      "base_price": 850.00,
      "available_seats": 42,
      "destination": { "id": "uuid", "name": "Tokyo" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8, "total_pages": 1 },
  "filters_applied": { "departure_city": "NYC", "arrival_city": "Tokyo", "date": "2026-07-15" }
}
```

### Hotels

| Method | Endpoint                | Description               | Auth       |
|--------|-------------------------|---------------------------|------------|
| GET    | /hotels                 | Search hotels             | No         |
| GET    | /hotels/:id             | Get hotel details+rooms   | No         |
| POST   | /hotels                 | Create hotel              | Admin      |
| PUT    | /hotels/:id             | Update hotel              | Admin      |
| DELETE | /hotels/:id             | Soft-delete hotel         | Admin      |

**GET /hotels?destination_id=uuid&check_in=2026-08-01&check_out=2026-08-05&guests=2&min_rating=3&max_price=300&sort=rating_desc**
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "name": "Tokyo Grand Hotel",
      "star_rating": 4,
      "description": "Luxury hotel in Shinjuku...",
      "image_url": "https://cdn.example.com/tokyo-grand.jpg",
      "address": "1-1-1 Shinjuku, Tokyo",
      "destination": { "id": "uuid", "name": "Tokyo" },
      "rooms": [
        {
          "id": "uuid",
          "room_type": "Deluxe Double",
          "price_per_night": 220.00,
          "max_guests": 2,
          "available_rooms": 5,
          "amenities": ["WiFi", "Breakfast", "City View"]
        },
        {
          "id": "uuid",
          "room_type": "Suite",
          "price_per_night": 350.00,
          "max_guests": 3,
          "available_rooms": 2,
          "amenities": ["WiFi", "Breakfast", "Lounge Access", "Spa"]
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 15, "total_pages": 1 }
}
```

### Tours / Packages

| Method | Endpoint              | Description              | Auth       |
|--------|-----------------------|--------------------------|------------|
| GET    | /tours                | Search tours             | No         |
| GET    | /tours/:id            | Get tour details         | No         |
| POST   | /tours                | Create tour              | Admin      |
| PUT    | /tours/:id            | Update tour              | Admin      |
| DELETE | /tours/:id            | Soft-delete tour         | Admin      |

**GET /tours?destination_id=uuid&min_price=500&max_price=3000&sort=price_asc**
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "name": "7-Day Japan Explorer",
      "description": "Explore Tokyo, Kyoto, and Osaka...",
      "duration_days": 7,
      "price_per_person": 1899.00,
      "max_capacity": 20,
      "available_slots": 12,
      "includes": ["Hotel", "Guide", "Transport", "Meals"],
      "itinerary": [
        { "day": 1, "title": "Arrive Tokyo", "description": "..." },
        { "day": 2, "title": "Tokyo City Tour", "description": "..." }
      ],
      "destination": { "id": "uuid", "name": "Japan" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 6, "total_pages": 1 }
}
```

### Bookings

| Method | Endpoint                    | Description                | Auth        |
|--------|-----------------------------|----------------------------|-------------|
| POST   | /bookings                   | Create a new booking       | Yes         |
| GET    | /bookings                   | List bookings (user/admin) | Yes         |
| GET    | /bookings/:id               | Get booking details        | Yes         |
| PATCH  | /bookings/:id/status        | Update booking status      | Yes*        |
| POST   | /bookings/:id/cancel        | Cancel booking             | Yes         |

**POST /bookings**
```json
// Request — Flight Booking
{
  "booking_type": "flight",
  "items": [
    {
      "item_type": "flight",
      "item_id": "uuid-flight-id",
      "quantity": 1,
      "passengers": [
        {
          "first_name": "Jane",
          "last_name": "Doe",
          "document_type": "passport",
          "document_number": "AB123456",
          "seat_class": "economy"
        },
        {
          "first_name": "John",
          "last_name": "Doe",
          "document_type": "passport",
          "document_number": "AB123457",
          "seat_class": "economy"
        }
      ]
    }
  ],
  "payment_method": "card",
  "notes": "Window seats preferred"
}

// Response 201
{
  "booking": {
    "id": "uuid",
    "reference_id": "TBK-20260605-A3F8K2P1",
    "booking_type": "flight",
    "status": "pending",
    "total_amount": 1700.00,
    "currency": "USD",
    "items": [
      {
        "id": "uuid",
        "item_type": "flight",
        "item": {
          "id": "uuid",
          "airline": "Delta",
          "flight_number": "DL275",
          "departure_city": "New York (JFK)",
          "arrival_city": "Tokyo (NRT)",
          "departure_time": "2026-07-15T23:30:00Z",
          "arrival_time": "2026-07-16T18:45:00Z"
        },
        "unit_price": 850.00,
        "subtotal": 1700.00,
        "passengers": [
          { "first_name": "Jane", "last_name": "Doe", "seat_class": "economy" },
          { "first_name": "John", "last_name": "Doe", "seat_class": "economy" }
        ]
      }
    ],
    "payment": {
      "id": "uuid",
      "amount": 1700.00,
      "payment_method": "card",
      "payment_status": "pending",
      "invoice_number": "INV-20260605-7K9M2X"
    }
  },
  "created_at": "2026-06-05T10:30:00Z"
}
```

**POST /bookings/:id/cancel**
```json
// Response 200
{
  "booking": {
    "id": "uuid",
    "reference_id": "TBK-20260605-A3F8K2P1",
    "status": "cancelled",
    "cancelled_at": "2026-06-06T14:00:00Z",
    "refund_status": "pending"
  },
  "message": "Booking cancelled. Refund will be processed within 5-7 business days."
}
```

### Payments

| Method | Endpoint                       | Description                | Auth       |
|--------|--------------------------------|----------------------------|------------|
| POST   | /payments/:id/process          | Process payment (mock)     | Yes        |
| GET    | /payments/:id                  | Get payment details        | Yes        |
| GET    | /payments/invoice/:invoice_num | Download invoice           | Yes        |

**POST /payments/:id/process**
```json
// Request
{
  "payment_method": "card",
  "card_last_four": "4242",
  "mock_success": true
}

// Response 200
{
  "payment": {
    "id": "uuid",
    "amount": 1700.00,
    "payment_method": "card",
    "payment_status": "paid",
    "invoice_number": "INV-20260605-7K9M2X",
    "paid_at": "2026-06-05T10:31:00Z"
  },
  "booking_status": "confirmed",
  "message": "Payment successful. Booking confirmed."
}
```

### Admin — Analytics

| Method | Endpoint                       | Description                  | Auth  |
|--------|--------------------------------|------------------------------|-------|
| GET    | /admin/analytics/overview      | Dashboard overview stats     | Admin |
| GET    | /admin/analytics/bookings      | Bookings over time           | Admin |
| GET    | /admin/analytics/revenue       | Revenue over time            | Admin |
| GET    | /admin/analytics/popular       | Popular destinations         | Admin |

**GET /admin/analytics/overview?from=2026-01-01&to=2026-06-05**
```json
// Response 200
{
  "total_bookings": 1240,
  "total_revenue": 892450.00,
  "total_users": 856,
  "bookings_today": 18,
  "revenue_today": 14250.00,
  "popular_destination": { "id": "uuid", "name": "Tokyo", "booking_count": 312 },
  "bookings_by_type": { "flight": 580, "hotel": 420, "tour": 240 },
  "revenue_by_type": { "flight": 423000, "hotel": 294000, "tour": 175450 },
  "period": { "from": "2026-01-01", "to": "2026-06-05" }
}
```

### Notifications

| Method | Endpoint                       | Description                  | Auth  |
|--------|--------------------------------|------------------------------|-------|
| GET    | /notifications                 | List user notifications      | Yes   |
| PATCH  | /notifications/:id/read        | Mark notification as read    | Yes   |
| POST   | /notifications/read-all        | Mark all as read             | Yes   |

---

## 4. Key Workflows

### 4.1 Flight Booking Flow (Step-by-Step)

```
1. SEARCH
   User visits /flights?departure_city=NYC&arrival_city=Tokyo&date=2026-07-15
   → GET /api/v1/flights?...
   → System queries flights table, returns available flights + seat counts

2. SELECT
   User clicks on flight DL275
   → GET /api/v1/flights/:id
   → Returns full details, duration, available seats

3. PASSENGER INFO
   User fills passenger details (name, passport, seat class)
   → Client-side validation only at this stage

4. REVIEW & BOOK
   User clicks "Book Now"
   → POST /api/v1/bookings
   → Server:
      a. Validates inputs (email existence, flight exists, seats available)
      b. BEGIN transaction
      c. INSERT INTO bookings (status='pending', reference_id=gen_ref())
      d. INSERT INTO booking_details
      e. INSERT INTO booking_passengers
      f. UPDATE flights SET available_seats = available_seats - 2
         → CHECK constraint: available_seats >= 0 (ROLLBACK if violated)
      g. INSERT INTO payments (status='pending', invoice_number=gen_inv())
      h. COMMIT
   → Response: booking + payment reference

5. PAYMENT
   User continues to checkout
   → POST /api/v1/payments/:id/process
   → Server:
      a. Update payment status to 'paid'
      b. Update booking status to 'confirmed'
      c. Enqueue notification job (email: booking confirmation)
      d. Update analytics_daily (recalculate)
   → Response: confirmation

6. CONFIRMATION
   → GET /api/v1/bookings/:id returns full booking with 'confirmed' status
   → User receives email: "Booking TBK-20260605-A3F8K2P1 Confirmed"
   → Invoice available at GET /api/v1/payments/invoice/INV-20260605-7K9M2X
```

### 4.2 Hotel Booking Flow

```
1. SEARCH → GET /api/v1/hotels?destination_id=uuid&dates=...
2. SELECT HOTEL → GET /api/v1/hotels/:id (includes available room types)
3. SELECT ROOM → User picks room type + quantity
4. BOOK → POST /api/v1/bookings
   {
     "booking_type": "hotel",
     "items": [{
       "item_type": "hotel",
       "item_id": "room-uuid",
       "quantity": 1,
       "check_in_date": "2026-08-01",
       "check_out_date": "2026-08-05"
     }],
     "payment_method": "cash_on_arrival"
   }
   → Server calculates nights (4), unit_price × nights × rooms = subtotal
   → Decrements hotel_rooms.available_rooms
5. PAYMENT → Cash on arrival skips payment processing; booking confirmed immediately
6. CONFIRMATION
```

### 4.3 Cancel Booking Flow

```
1. User requests cancellation
   → POST /api/v1/bookings/:id/cancel
   → Server:
      a. Verify booking belongs to user (or user is admin)
      b. Validate booking is not already cancelled/completed
      c. BEGIN transaction
      d. UPDATE bookings SET status='cancelled'
      e. Restore inventory:
         - Flight: UPDATE flights SET available_seats += quantity
         - Hotel: UPDATE hotel_rooms SET available_rooms += quantity
         - Tour: UPDATE tours SET available_slots += quantity
      f. If payment was 'paid', create refund record (payment_status='refunded')
      g. Enqueue notification: cancellation email
      h. COMMIT
```

### 4.4 Admin: Add New Flight

```
1. Admin clicks "Add Flight" in dashboard
2. POST /api/v1/flights (requires JWT with role=admin)
   {
     "destination_id": "uuid",
     "airline": "Delta",
     "flight_number": "DL276",
     "departure_city": "Tokyo (NRT)",
     "arrival_city": "New York (JFK)",
     "departure_time": "2026-07-20T10:00:00Z",
     "arrival_time": "2026-07-20T19:30:00Z",
     "seat_class": "economy",
     "base_price": 780.00,
     "available_seats": 180
   }
3. Server validates, inserts flight record
4. Flight appears in search results immediately
```

### 4.5 Payment-on-Arrival / Cash Flow

```
1. User selects "cash_on_arrival" during booking
2. POST /bookings → payment_method='cash_on_arrival'
3. Server:
   - Creates payment record with payment_status='pending'
   - Sets booking status to 'confirmed' (no immediate payment needed)
   - Generates invoice marked "Payment on Arrival"
4. At arrival, staff marks payment as 'paid' via admin dashboard
   → PATCH /api/v1/bookings/:id/payment-status
```

---

## 5. Sample Code Structure

### Backend (Node.js + Express + TypeScript)

```
backend/
├── src/
│   ├── index.ts                    # Entry point, server bootstrap
│   ├── app.ts                      # Express app setup, middleware
│   ├── config/
│   │   ├── index.ts                # Env config loader
│   │   ├── database.ts             # Prisma client singleton
│   │   ├── redis.ts                # Redis client
│   │   └── logger.ts               # Winston logger
│   ├── middleware/
│   │   ├── authenticate.ts         # JWT verification → req.user
│   │   ├── authorize.ts            # Role-based guard
│   │   ├── validate.ts             # Zod schema validation
│   │   ├── rateLimiter.ts          # Rate limiting
│   │   ├── errorHandler.ts         # Global error handler
│   │   └── asyncHandler.ts         # Async route wrapper
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.validation.ts  # Zod schemas
│   │   │   └── auth.test.ts
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.validation.ts
│   │   │   └── user.test.ts
│   │   ├── flights/
│   │   │   ├── flight.controller.ts
│   │   │   ├── flight.service.ts
│   │   │   ├── flight.routes.ts
│   │   │   ├── flight.validation.ts
│   │   │   └── flight.test.ts
│   │   ├── hotels/
│   │   │   ├── hotel.controller.ts
│   │   │   ├── hotel.service.ts
│   │   │   ├── hotel.routes.ts
│   │   │   ├── hotel.validation.ts
│   │   │   └── hotel.test.ts
│   │   ├── tours/
│   │   │   ├── tour.controller.ts
│   │   │   ├── tour.service.ts
│   │   │   ├── tour.routes.ts
│   │   │   ├── tour.validation.ts
│   │   │   └── tour.test.ts
│   │   ├── bookings/
│   │   │   ├── booking.controller.ts
│   │   │   ├── booking.service.ts
│   │   │   ├── booking.routes.ts
│   │   │   ├── booking.validation.ts
│   │   │   ├── booking.test.ts
│   │   │   └── booking.utils.ts    # Reference ID generator
│   │   ├── payments/
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.service.ts  # Mock gateway integration
│   │   │   ├── payment.routes.ts
│   │   │   ├── payment.validation.ts
│   │   │   └── payment.test.ts
│   │   ├── notifications/
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── notification.validation.ts
│   │   │   └── notification.test.ts
│   │   ├── destinations/
│   │   │   ├── destination.controller.ts
│   │   │   ├── destination.service.ts
│   │   │   ├── destination.routes.ts
│   │   │   └── destination.validation.ts
│   │   └── admin/
│   │       ├── admin.controller.ts
│   │       ├── admin.service.ts     # Analytics aggregation
│   │       ├── admin.routes.ts
│   │       └── admin.validation.ts
│   ├── jobs/
│   │   ├── queue.ts                 # Bull queue setup
│   │   ├── notification.job.ts      # Email/SMS sender worker
│   │   └── analytics.job.ts         # Daily aggregation worker
│   ├── utils/
│   │   ├── jwt.ts                   # Token sign/verify helpers
│   │   ├── password.ts              # bcrypt hash/compare
│   │   ├── reference.ts             # TBK-YYYYMMDD-XXXXXXXX generator
│   │   ├── invoice.ts               # INV-YYYYMMDD-XXXXXXXX generator
│   │   ├── pricing.ts               # Tax calculations, discounts
│   │   └── pagination.ts            # Offset/limit helper
│   └── types/
│       ├── express.d.ts             # Augment Express.Request with user
│       ├── enums.ts                 # All enums (Role, BookingStatus, etc.)
│       └── index.ts                 # Shared interfaces
├── prisma/
│   ├── schema.prisma                # Full Prisma schema (all tables above)
│   └── migrations/
├── tests/
│   ├── integration/
│   └── fixtures/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

### Frontend (Next.js 14 + Tailwind CSS)

```
frontend/
├── src/
│   ├── app/                          # App Router (Next.js 14)
│   │   ├── layout.tsx                # Root layout, providers
│   │   ├── page.tsx                  # Home / Landing page
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── search/
│   │   │   ├── page.tsx              # Search results (flights/hotels/tours)
│   │   │   └── loading.tsx
│   │   ├── flights/
│   │   │   ├── [id]/page.tsx         # Flight detail + book
│   │   │   └── results/page.tsx
│   │   ├── hotels/
│   │   │   ├── [id]/page.tsx         # Hotel detail + room selection
│   │   │   └── results/page.tsx
│   │   ├── tours/
│   │   │   ├── [id]/page.tsx
│   │   │   └── results/page.tsx
│   │   ├── booking/
│   │   │   ├── [id]/page.tsx         # Booking summary / confirmation
│   │   │   └── checkout/
│   │   │       └── [bookingId]/page.tsx
│   │   ├── profile/
│   │   │   ├── page.tsx              # User profile
│   │   │   └── bookings/page.tsx     # My bookings
│   │   ├── admin/
│   │   │   ├── layout.tsx            # Admin layout (role guard)
│   │   │   ├── page.tsx              # Dashboard / analytics
│   │   │   ├── users/page.tsx
│   │   │   ├── flights/page.tsx      # Manage flights
│   │   │   ├── hotels/page.tsx       # Manage hotels
│   │   │   ├── tours/page.tsx        # Manage tours
│   │   │   ├── destinations/page.tsx
│   │   │   └── bookings/page.tsx
│   │   └── notifications/page.tsx
│   ├── components/
│   │   ├── ui/                       # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx            # Nav, user menu
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx           # Admin sidebar
│   │   ├── search/
│   │   │   ├── SearchFilters.tsx     # Price range, dates, class
│   │   │   ├── SearchResults.tsx
│   │   │   ├── FlightCard.tsx
│   │   │   ├── HotelCard.tsx
│   │   │   └── TourCard.tsx
│   │   ├── booking/
│   │   │   ├── FlightBookingForm.tsx  # Passenger form
│   │   │   ├── HotelBookingForm.tsx   # Room selection + dates
│   │   │   ├── TourBookingForm.tsx
│   │   │   ├── BookingSummary.tsx
│   │   │   ├── PaymentForm.tsx        # Card / cash-on-arrival
│   │   │   └── BookingConfirmation.tsx
│   │   ├── admin/
│   │   │   ├── AnalyticsCards.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── BookingsTable.tsx
│   │   │   └── ManageForm.tsx         # Generic CRUD form
│   │   └── notifications/
│   │       └── NotificationBell.tsx
│   ├── lib/
│   │   ├── api.ts                    # Axios/fetch wrapper with JWT
│   │   ├── auth.ts                   # Auth context / provider
│   │   ├── utils.ts                  # formatCurrency, formatDate, etc.
│   │   └── validators.ts             # Client-side Zod schemas
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBookings.ts
│   │   └── useNotifications.ts
│   └── styles/
│       └── globals.css               # Tailwind imports + custom
├── public/
│   ├── images/
│   └── icons/
├── tailwind.config.ts
├── next.config.js
├── package.json
├── tsconfig.json
└── .env.local
```

---

## 6. Security & Constraints

### Security Checklist
- [ ] Password hashing: bcrypt (cost 12)
- [ ] JWT: RS256 or HS256, short-lived access tokens (15 min)
- [ ] Refresh tokens: stored in httpOnly, Secure, SameSite=Strict cookies
- [ ] Input validation: Zod schemas on every endpoint
- [ ] SQL injection: prevented by Prisma parameterized queries
- [ ] XSS: React auto-escapes, Content-Security-Policy headers
- [ ] CSRF: SameSite cookies + CSRF tokens for cookie-based auth
- [ ] Rate limiting: 100 req/min per IP (general), 10 req/min (auth)
- [ ] Role-based access: middleware enforces route-level guards
- [ ] Inventory race conditions: database-level CHECK constraints + row-level locking (`SELECT ... FOR UPDATE`)
- [ ] Audit logging: all admin actions logged to `audit_logs` table

### Performance Constraints
- Pagination: required on all list endpoints (default 20, max 100)
- Search: full-text search via PostgreSQL `tsvector` indexes
- Caching: Redis cache for destinations and popular searches (TTL: 5 min)
- DB connection pool: max 20 connections per instance
- Booking creation: wrapped in a database transaction
- File uploads: max 5 MB per image

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_SEATS",
    "message": "Only 1 seat available, requested 2",
    "details": { "available": 1, "requested": 2 }
  },
  "timestamp": "2026-06-05T10:30:00Z",
  "path": "/api/v1/bookings"
}
```

### Pagination Response Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 7. Implementation Phases

| Phase | Tasks | Est. Duration |
|-------|-------|---------------|
| **Phase 1: Foundation** | Project scaffolding, Prisma schema + migrations, JWT auth (register/login), Docker setup | 3 days |
| **Phase 2: Core Search** | Flights, Hotels, Tours CRUD + search/filter endpoints, destination management | 4 days |
| **Phase 3: Booking Engine** | Booking creation with transaction safety, inventory management, reference ID generation | 4 days |
| **Phase 4: Payments** | Mock payment gateway integration, invoice generation, cash-on-arrival flow, payment status tracking | 2 days |
| **Phase 5: Frontend** | Pages: Home, Search, Booking flow, Checkout, Profile; responsive UI with Tailwind | 6 days |
| **Phase 6: Admin Dashboard** | User/booking/CRUD management, analytics aggregation, revenue charts | 4 days |
| **Phase 7: Notifications** | Email template engine, in-app notification system, queue jobs for async delivery | 2 days |
| **Phase 8: Polish** | Error handling, input validation edge cases, load testing, documentation | 3 days |

**Total estimated: ~28 days (1 developer)**

---

## 8. Prisma Schema (Quick Reference)

```prisma
model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique @db.VarChar(255)
  passwordHash  String    @map("password_hash") @db.VarChar(255)
  role          Role      @default(customer)
  firstName     String    @map("first_name") @db.VarChar(100)
  lastName      String    @map("last_name") @db.VarChar(100)
  phone         String?   @db.VarChar(20)
  preferences   Json?     @default("{}")
  isActive      Boolean   @default(true) @map("is_active")
  refreshToken  String?   @map("refresh_token")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  bookings      Booking[]
  notifications Notification[]

  @@map("users")
}

model Booking {
  id          String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String        @map("user_id") @db.Uuid
  bookingType BookingType   @map("booking_type")
  status      BookingStatus @default(pending)
  totalAmount Decimal       @map("total_amount") @db.Decimal(10, 2)
  currency    String        @default("USD") @db.VarChar(3)
  referenceId String        @unique @map("reference_id") @db.VarChar(20)
  notes       String?       @db.Text
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  user          User            @relation(fields: [userId], references: [id])
  details       BookingDetail[]
  payments      Payment[]

  @@map("bookings")
}

// Full schema extends with all models listed in Section 2 above
```

---

*End of Specification Document*
