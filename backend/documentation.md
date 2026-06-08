# Travel Booking System — Backend API Documentation

## Overview

Express.js + TypeScript + Prisma REST API for a travel booking platform. PostgreSQL database, JWT authentication, Zod validation.

| Property | Value |
|---|---|
| Base URL | `http://localhost:4000/api/v1` |
| Auth | JWT access tokens + httpOnly refresh cookies |
| Validation | Zod schemas on all inputs |
| Response format | `{ success, data?, pagination?, message?, error? }` |

---

## Authentication

Access tokens are sent via `Authorization: Bearer <token>` header. Refresh tokens are stored in an httpOnly cookie named `refreshToken`.

**Rate limiting:** Auth endpoints are limited to 100 requests/minute per IP.

### Health Check

```
GET /health
```

No auth required. Returns server status, timestamp, and uptime.

### Register

```
POST /auth/register
```

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "Str0ng!Pass",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "customer"
}
```

`role` defaults to `customer`. Options: `customer`, `travel_agent`, `admin`. Password requires min 8 chars with uppercase, lowercase, digit, and special character.

**Response 201:**

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "customer", "firstName": "...", "lastName": "..." },
    "accessToken": "eyJ..."
  }
}
```

Sets `refreshToken` httpOnly cookie.

### Login

```
POST /auth/login
```

**Request body:**

```json
{ "email": "admin@travel.com", "password": "Password123!" }
```

**Response 200:** Same shape as register. Sets `refreshToken` cookie.

### Logout

```
POST /auth/logout
```

Auth required. Clears refresh token from DB and cookie.

### Refresh Token

```
POST /auth/refresh
```

**Request body** (or cookie):

```json
{ "refreshToken": "eyJ..." }
```

Rotates the token — returns a new access token and a new refresh cookie.

---

## Users

### Get Current User

```
GET /users/me
```

Auth required. Returns the authenticated user's profile (no password hash).

### Update Profile

```
PATCH /users/me
```

Auth required.

```json
{ "firstName": "...", "lastName": "...", "phone": "...", "preferences": { "currency": "USD", "language": "en", "notifications": true } }
```

### My Bookings

```
GET /users/me/bookings
```

Auth required. Returns all bookings for the current user, ordered by newest first, with details and payments included.

### List Users (Admin)

```
GET /users
```

Admin only. **Query params:** `role`, `is_active`, `search` (name/email), `page`, `limit`.

### Get User by ID (Admin)

```
GET /users/:id
```

Admin only.

### Update User (Admin)

```
PATCH /users/:id
```

Admin only. Same body as profile update.

---

## Destinations

### List Destinations

```
GET /destinations
```

No auth. **Query params:** `country`, `is_active`, `search` (name), `sort_by` (`name`, `country`, `createdAt`), `sort_order` (`asc`, `desc`), `page`, `limit`.

### Get Destination

```
GET /destinations/:id
```

No auth. Returns destination with `_count` of related flights, hotels, tours.

### Create Destination (Admin)

```
POST /destinations
```

Admin only.

```json
{ "name": "Tokyo", "country": "Japan", "description": "...", "imageUrl": "..." }
```

### Update Destination (Admin)

```
PUT /destinations/:id
```

Admin only. All fields optional.

### Delete Destination (Admin)

```
DELETE /destinations/:id
```

Admin only. Soft-delete (sets `isActive = false`).

---

## Flights

### List Flights

```
GET /flights
```

No auth. **Query params:**

| Param | Type | Description |
|---|---|---|
| `departure_city` | string | Case-insensitive contains |
| `arrival_city` | string | Case-insensitive contains |
| `date` | string (ISO) | Filters by departureTime on that day |
| `seat_class` | enum | `economy`, `business`, `first` |
| `min_price` | number | Minimum basePrice |
| `max_price` | number | Maximum basePrice |
| `destination_id` | UUID | Exact match |
| `sort` | string | `price`, `duration`, `departureTime` (default) |
| `page` | number | Default 1 |
| `limit` | number | Default 20, max 100 |

Returns only active flights. Includes destination data.

### Get Flight

```
GET /flights/:id
```

No auth. Includes destination.

### Create Flight (Admin)

```
POST /flights
```

Admin only.

```json
{
  "destinationId": "uuid",
  "airline": "Japan Airlines",
  "flightNumber": "JL001",
  "departureCity": "New York",
  "arrivalCity": "Tokyo",
  "departureTime": "2026-06-10T10:00:00Z",
  "arrivalTime": "2026-06-11T06:00:00Z",
  "durationMin": 780,
  "seatClass": "economy",
  "basePrice": 899.00,
  "availableSeats": 150
}
```

### Update Flight (Admin)

```
PUT /flights/:id
```

Admin only. All fields optional.

### Delete Flight (Admin)

```
DELETE /flights/:id
```

Admin only. Soft-delete.

### Update Seats (Admin)

```
PATCH /flights/:id/seats
```

Admin only.

```json
{ "available_seats": 120 }
```

---

## Hotels

### List Hotels

```
GET /hotels
```

No auth. **Query params:**

| Param | Type | Description |
|---|---|---|
| `destination_id` | UUID | Exact match |
| `min_rating` | number (1-5) | Minimum starRating |
| `max_price` | number | Filters rooms with pricePerNight <= value |
| `search` | string | Case-insensitive name contains |
| `sort` | string | `rating`, `price` (proxied), `name` (default) |

Returns only active hotels with their available rooms. Includes destination.

### Get Hotel

```
GET /hotels/:id
```

No auth. Includes destination and active rooms.

### Create Hotel (Admin)

```
POST /hotels
```

Admin only.

```json
{
  "destinationId": "uuid",
  "name": "Grand Hotel Tokyo",
  "address": "1-1-1 Marunouchi",
  "starRating": 5,
  "description": "...",
  "imageUrl": "...",
  "rooms": [
    { "roomType": "Deluxe", "pricePerNight": 350, "maxGuests": 2, "totalRooms": 20, "availableRooms": 15, "amenities": ["WiFi", "TV"] }
  ]
}
```

### Update Hotel (Admin)

```
PUT /hotels/:id
```

Admin only. All fields optional.

### Delete Hotel (Admin)

```
DELETE /hotels/:id
```

Admin only. Soft-delete (also soft-deletes all rooms).

---

## Tours

### List Tours

```
GET /tours
```

No auth. **Query params:**

| Param | Type | Description |
|---|---|---|
| `destination_id` | UUID | Exact match |
| `search` | string | Case-insensitive name contains |
| `min_price` | number | Minimum pricePerPerson |
| `max_price` | number | Maximum pricePerPerson |
| `min_duration` | number | Minimum durationDays |
| `max_duration` | number | Maximum durationDays |
| `sort` | string | `price`, `duration`, `name` (default) |

Returns only active tours. Includes destination.

### Get Tour

```
GET /tours/:id
```

No auth. Includes destination.

### Create Tour (Admin)

```
POST /tours
```

Admin only.

```json
{
  "destinationId": "uuid",
  "name": "Tokyo Highlights Tour",
  "description": "...",
  "durationDays": 5,
  "pricePerPerson": 1500,
  "maxCapacity": 20,
  "availableSlots": 15,
  "includes": ["Hotel", "Guide"],
  "itinerary": [{ "day": 1, "title": "Arrival", "description": "..." }]
}
```

### Update Tour (Admin)

```
PUT /tours/:id
```

Admin only. All fields optional.

### Delete Tour (Admin)

```
DELETE /tours/:id
```

Admin only. Soft-delete.

---

## Bookings

### Create Booking

```
POST /bookings
```

Auth required (customer, agent, or admin).

```json
{
  "bookingType": "flight",
  "items": [
    {
      "itemType": "flight",
      "itemId": "uuid",
      "quantity": 2,
      "passengers": [
        { "firstName": "John", "lastName": "Doe", "documentType": "passport", "documentNumber": "AB123456" }
      ]
    }
  ],
  "paymentMethod": "card",
  "notes": "Window seat please"
}
```

**bookingType** can be `flight`, `hotel`, `tour`, or `package`. **paymentMethod** is `card` or `cash_on_arrival`.

For hotels, `checkInDate` and `checkOutDate` are required on each item. For flights, `passengers` should match `quantity`.

**Booking flow:**
1. Validates inventory for all items
2. Calculates total price (flight: `basePrice × passengers`, hotel: `pricePerNight × nights`, tour: `pricePerPerson`)
3. Creates booking with `pending` status
4. Decrements inventory (availableSeats/availableRooms/availableSlots)
5. Creates a `pending` payment record
6. If `cash_on_arrival`, immediately confirms the booking
7. Generates a reference ID (`TBK-YYYYMMDD-XXXXXXXX`)

**Response 201:** Full booking with details, passengers, payments, and user info.

### List Bookings

```
GET /bookings
```

Auth required. **Query params:** `status`, `bookingType`, `fromDate`, `toDate`, `page`, `limit`.

Non-admin users only see their own bookings.

### Get Booking

```
GET /bookings/:id
```

Auth required. Full details with user info, passengers, payments. Access control: owner or admin.

### Update Booking Status (Admin/Agent)

```
PATCH /bookings/:id/status
```

Admin or travel_agent only.

```json
{ "status": "confirmed" }
```

Valid transitions: `pending → confirmed/cancelled`, `confirmed → completed/cancelled`. Cancelling a paid booking auto-refunds the payment.

### Cancel Booking

```
POST /bookings/:id/cancel
```

Auth required (owner or admin).

```json
{ "reason": "Change of plans" }
```

Restores inventory, refunds paid payments. Only `pending` or `confirmed` bookings can be cancelled.

---

## Payments

### Process Payment

```
POST /payments/:id/process
```

Auth required (owner or admin). Processes a pending payment.

```json
{
  "paymentMethod": "card",
  "cardLastFour": "1234",
  "mockSuccess": true
}
```

**Mock gateway:** Simulates a payment response. If `mockSuccess: false`, the payment fails. On success, booking status changes to `confirmed` and a receipt notification is created.

### Get Payment

```
GET /payments/:id
```

Auth required (owner or admin).

### Get Invoice

```
GET /payments/invoice/:invoiceNumber
```

Auth required. Returns a structured invoice with customer info, booking items, totals.

---

## Notifications

### List Notifications

```
GET /notifications
```

Auth required. **Query params:** `is_read`, `type`, `page`, `limit`. Returns notifications for the authenticated user.

### Mark as Read

```
PATCH /notifications/:id/read
```

Auth required. Marks a single notification as read. Ownership check enforced.

### Mark All as Read

```
POST /notifications/read-all
```

Auth required. Marks all unread notifications for the user as read. Returns `{ count }`.

---

## Admin Analytics

All admin endpoints require `admin` role.

### Overview

```
GET /admin/analytics/overview
```

**Query params:** `from`, `to` (ISO dates). Returns total bookings, revenue, users, today's metrics, breakdowns by type, and popular destinations.

### Bookings Trend

```
GET /admin/analytics/bookings
```

**Required params:** `from`, `to`. **Optional:** `groupBy` (`day`, `week`, `month`). Returns time-series data of booking counts and revenue.

### Revenue Trend

```
GET /admin/analytics/revenue
```

**Required params:** `from`, `to`. **Optional:** `groupBy` (`day`, `week`, `month`). Returns time-series revenue data.

### Popular Destinations

```
GET /admin/analytics/popular
```

**Query params:** `limit` (default 10). Returns destinations ranked by booking count.

---

## Data Models

### User

| Field | Type | Notes |
|---|---|---|
| id | UUID | Auto-generated |
| email | string | Unique |
| role | enum | `customer`, `travel_agent`, `admin` |
| firstName | string | |
| lastName | string | |
| phone | string? | |
| preferences | object? | `{ currency, language, notifications }` |
| isActive | boolean | Default: true |

### Destination

| Field | Type |
|---|---|
| id | UUID |
| name | string |
| country | string |
| description | text? |
| imageUrl | string? |

### Flight

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| destinationId | UUID | FK → Destination |
| airline | string | |
| flightNumber | string | Indexed |
| departureCity | string | |
| arrivalCity | string | |
| departureTime | datetime | |
| arrivalTime | datetime | |
| durationMin | int | Minutes |
| seatClass | enum | `economy`, `business`, `first` |
| basePrice | decimal(10,2) | |
| availableSeats | int | |

### Hotel

| Field | Type |
|---|---|
| id | UUID |
| destinationId | UUID |
| name | string |
| address | string? |
| starRating | int (1-5) |
| description | text? |
| imageUrl | string? |

### HotelRoom

| Field | Type |
|---|---|
| id | UUID |
| hotelId | UUID |
| roomType | string |
| pricePerNight | decimal(10,2) |
| maxGuests | int |
| totalRooms | int |
| availableRooms | int |
| amenities | json? |

### Tour

| Field | Type |
|---|---|
| id | UUID |
| destinationId | UUID |
| name | string |
| description | text? |
| durationDays | int |
| pricePerPerson | decimal(10,2) |
| maxCapacity | int |
| availableSlots | int |
| includes | json? |
| itinerary | json? |

### Booking

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| userId | UUID | FK → User |
| bookingType | enum | `flight`, `hotel`, `tour`, `package` |
| status | enum | `pending`, `confirmed`, `cancelled`, `completed` |
| totalAmount | decimal(10,2) | |
| currency | string | Default: USD |
| referenceId | string | Unique, auto-generated |
| notes | text? | |

### BookingDetail (itemized items on a booking)

| Field | Type |
|---|---|
| id | UUID |
| bookingId | UUID |
| itemType | enum (`flight`, `hotel`, `tour`) |
| itemId | string |
| checkInDate | datetime? |
| checkOutDate | datetime? |
| quantity | int |
| unitPrice | decimal(10,2) |
| subtotal | decimal(10,2) |

### BookingPassenger

| Field | Type |
|---|---|
| id | UUID |
| bookingDetailId | UUID |
| firstName | string |
| lastName | string |
| documentType | string? |
| documentNumber | string? |
| seatClass | string? |

### Payment

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| bookingId | UUID | |
| amount | decimal(10,2) | |
| currency | string | Default: USD |
| paymentMethod | enum | `card`, `cash_on_arrival` |
| paymentStatus | enum | `pending`, `paid`, `failed`, `refunded` |
| invoiceNumber | string | Unique, auto-generated |
| paidAt | datetime? | |
| gatewayResponse | json? | Mock gateway data |

### Notification

| Field | Type |
|---|---|
| id | UUID |
| userId | UUID |
| type | enum (`booking_confirmation`, `cancellation`, `payment_receipt`, `reminder`, `promotional`) |
| channel | enum (`email`, `sms`, `in_app`) |
| subject | string? |
| message | text |
| isRead | boolean |

---

## Common Errors

| Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input (Zod schema failure) |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient role |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate (e.g., email already registered) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

Error response shape:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

---

## Setup & Running

### Environment variables (`.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/travel_booking?schema=public"
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800
PORT=4000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

### Commands

```bash
npm run dev        # Start dev server with hot reload (tsx watch)
npm run build      # Compile TypeScript
npm start          # Run compiled JS
npm test           # Jest tests

npx prisma migrate dev   # Run migrations
npx prisma db push       # Push schema changes
npm run seed             # Seed database (3 users, 3 destinations, 9 flights, 6 hotels, 6 tours)
npm run db:seed          # Alias for seed
```

### Default seed users

Seeded via `src/seed.ts` (also at `prisma/seed.ts`). Run `npm run seed` after migrations. Clears all existing data before seeding.

| Email | Role | Password |

| Email | Role | Password |
|---|---|---|
| admin@travel.com | admin | Password123! |
| agent@travel.com | travel_agent | Password123! |
| customer@example.com | customer | Password123! |

---

## Middleware Stack (order in app.ts)

1. CORS — allows credentials from `CORS_ORIGIN`
2. Helmet — security headers
3. Morgan — HTTP request logging
4. Cookie parser
5. JSON body parser (10mb limit)
6. URL-encoded parser
7. Rate limiter — 100 requests/IP/60s
8. All routes at `/api/v1`
9. Global error handler

---

## Pagination

List endpoints return paginated responses with this shape:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 57,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

Default: `page=1`, `limit=20`. Maximum `limit` is 100.
