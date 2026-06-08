# Travel Agent - User Flow Diagram

## 1. Site Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PUBLIC ROUTES                            │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Landing    │   Browse     │   Auth       │  Search (legacy)   │
│   /          │ /flights     │ /login       │  /search           │
│              │ /hotels      │ /register    │                    │
│              │ /tours       │              │                    │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│                      PROTECTED ROUTES                           │
├──────────────┬──────────────┬──────────────────┬───────────────┤
│ Profile      │ Bookings     │  Checkout        │ Notifications │
│ /profile     │/profile/     │ /booking/        │ /notifications│
│              │ bookings     │ checkout/[id]    │               │
│              │ /booking/[id]│                  │               │
├──────────────┴──────────────┴──────────────────┴───────────────┤
│                      ADMIN ROUTES (admin only)                  │
├──────────────┬──────────┬──────────┬──────────┬──────────┬─────┤
│ Dashboard    │ Flights  │ Hotels   │ Tours    │ Bookings │ ... │
│ /admin       │/admin/   │ /admin/  │ /admin/  │ /admin/  │     │
│              │ flights  │ hotels   │ tours    │ bookings │     │
└──────────────┴──────────┴──────────┴──────────┴──────────┴─────┘
```

Clean routes `/flights`, `/hotels`, `/tours` each use the shared `SearchView` component with type-specific filters.

---

## 2. Guest User Flow (Not Logged In)

```
                     ┌──────────────┐
                     │   Landing    │
                     │   Page (/)   │
                     │  - Flight    │
                     │    search    │
                     │    with      │
                     │  autocomplete│
                     └──────┬───────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │  Flights │   │  Hotels  │   │   Tours  │
     │ /flights │   │ /hotels  │   │  /tours  │
     └────┬─────┘   └────┬─────┘   └────┬─────┘
          │              │              │
          │   ┌──────────┘              │
          │   │                         │
          ▼   ▼                         ▼
     ┌─────────────────────────────────────┐
     │         SearchView                   │
     │  - Filters (local state)            │
     │  - Autocomplete on city/hotel/tour  │
     │  - "Apply Filters" button           │
     │  - Results keep visible on refetch  │
     └──────┬──────────────────────────┬────┘
            │                          │
            ▼                          ▼
     ┌──────────────┐         ┌──────────────┐
     │  Detail Page │         │  Detail Page  │
     │ /flights/[id]│         │ /hotels/[id]  │
     │ /tours/[id]  │         │               │
     └──────┬───────┘         └──────┬────────┘
            │                        │
            │   Click "Book Now"     │
            ▼                        ▼
     ┌───────────────────────────────────┐
     │          Login Page                │
     │       /login (redirect)            │
     │  (must be authenticated to book)   │
     └───────────────────────────────────┘
```

---

## 3. Authenticated User Flow

```
                    ┌──────────────────────┐
                    │    Landing / Search   │
                    └───────────┬───────────┘
                                │
                    Click "Book Now" on any item
                                │
                                ▼
                    ┌──────────────────────┐
                    │  Booking Checkout     │
                    │ /booking/checkout/[id]│
                    │                      │
                    │  - Select quantity    │
                    │  - Enter guest info   │
                    │  - Choose payment:    │
                    │    • Card (mock)      │
                    │    • Cash on arrival  │
                    └───────────┬───────────┘
                                │
                          Submit Booking
                                │
                                ▼
                    ┌──────────────────────┐
                    │  Booking Confirmation │
                    │ /booking/[id]         │
                    │                      │
                    │  - Reference ID       │
                    │  - Status: pending /  │
                    │    confirmed          │
                    │  - Invoice download   │
                    │  - Cancel option      │
                    └──────────────────────┘

   ┌──────────────────┬──────────────────────┬─────────────────┐
   │                  │                      │                 │
   ▼                  ▼                      ▼                 ▼
┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Profile │   │ My Bookings  │   │ Notifications│   │   Logout     │
│ /profile │   │/profile/     │   │/notifications│   │              │
│          │   │ bookings     │   │              │   │              │
│ - Name   │   │ - List all   │   │ - Unread     │   │              │
│ - Email  │   │   bookings   │   │   count      │   │              │
│ - Role   │   │ - View status│   │ - Mark read  │   │              │
└──────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 4. Admin Flow

```
                    ┌────────────────────────┐
                    │    Admin Dashboard     │
                    │       /admin           │
                    │                        │
                    │  - Total bookings      │
                    │  - Revenue overview    │
                    │  - Popular destinations│
                    │  - Bookings/revenue    │
                    │    trends              │
                    └──────┬─────────────────┘
                           │
          ┌────────────────┼──────────────────┬──────────────┐
          ▼                ▼                  ▼              ▼
   ┌──────────┐    ┌──────────┐     ┌──────────┐    ┌──────────┐
   │  Users   │    │ Flights  │     │  Hotels  │    │  Tours   │
   │/admin/   │    │/admin/   │     │/admin/   │    │/admin/   │
   │ users    │    │ flights  │     │ hotels   │    │ tours    │
   └──────────┘    └──────────┘     └──────────┘    └──────────┘
                                                         │
          ┌──────────────────────────────────────────────┘
          │
   ┌──────────┐    ┌──────────────┐
   │ Bookings │    │ Destinations │
   │/admin/   │    │/admin/       │
   │ bookings │    │ destinations │
   └──────────┘    └──────────────┘

   Each CRUD page provides:
   ┌──────────────────────────────────┐
   │  + Add New button                │
   │  - Table with columns            │
   │  - Click row to edit             │
   │  - Delete with confirmation      │
   │  - Pagination                    │
   └──────────────────────────────────┘
```

---

## 5. Payment Flow

```
                    ┌────────────────────────┐
                    │    Checkout Page       │
                    │ /booking/checkout/[id] │
                    └───────────┬────────────┘
                                │
                    Choose payment method
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Card Payment   │  │ Cash on Arrival  │  │ (Future: other)  │
│   (mock)         │  │                  │  │                  │
│                  │  │ - No upfront     │  │                  │
│ - Enter card     │  │   payment        │  │                  │
│   details        │  │ - Immediate      │  │                  │
│ - Processing...  │  │   confirmation   │  │                  │
│ - May succeed or │  │ - Pay at hotel/  │  │                  │
│   fail (mock)    │  │   tour start     │  │                  │
└────────┬─────────┘  └────────┬─────────┘  └──────────────────┘
         │                     │
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Card SUCCESS    │  │  Cash on Arrival │
│  → Booking:      │  │  → Booking:      │
│     pending      │  │     confirmed    │
│  (waiting for    │  │                  │
│   processing)    │  │                  │
└──────────────────┘  └──────────────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
          ┌──────────────────┐
          │  Booking Detail  │
          │  /booking/[id]   │
          │                  │
          │  - Reference ID  │
          │  - Payment info  │
          │  - Invoice       │
          │  - Cancel option │
          └──────────────────┘
```

---

## 6. API Data Flow

```
┌──────────┐         ┌────────────┐         ┌──────────┐
│  Browser │  HTTP   │  Backend   │  Prisma  │  Postgres│
│ (Next.js)│◄───────►│(Express.js)│◄────────►│   DB     │
│ Port 3000│  (JWT)  │ Port 4000  │   ORM    │          │
└──────────┘         └────────────┘         └──────────┘

Authentication flow:
  Browser                  Backend                  DB
    │                        │                      │
    │── POST /auth/login ───►│                      │
    │                        │── verify password ──►│
    │                        │◄── user data ────────│
    │◄── { accessToken,     │                      │
    │      user }            │                      │
    │◄── httpOnly cookie     │                      │
    │    (refreshToken)      │                      │
    │                        │                      │
    │── GET /users/me ──────►│                      │
    │   (Authorization: Bearer <token>)             │
    │                        │── verify JWT ────────│
    │◄── user profile ──────│                      │

Booking flow (transactional):
  Browser             Backend                       DB
    │                     │                          │
    │── POST /bookings ──►│                          │
    │                     │── BEGIN TRANSACTION ────►│
    │                     │── check inventory ──────►│
    │                     │── decrement seats ──────►│
    │                     │── create booking ───────►│
    │                     │── create payment ───────►│
    │                     │── COMMIT ───────────────►│
    │◄── booking ────────│                          │

Search flow with autocomplete:
    │                     │                          │
    │── GET /flights?departure_city=New ────────────►│
    │   (autocomplete debounced 250ms)               │
    │◄── matched flights ───────────────────────────│
    │   (suggestions extracted: unique cities)       │
    │                     │                          │
    │── GET /flights?departure_city=New+York ───────►│
    │   (actual search on apply)                     │
    │◄── paginated results ─────────────────────────│
```

---

## 7. Navigation Map (Header Menu)

```
┌─────────────────────────────────────────────────────────────┐
│  [✈]  TravelAgent    Home  Flights  Hotels  Tours          │
│                              ▼       ▼       ▼              │
│                         /flights /hotels /tours             │
│                         (search  (search  (search           │
│                          flights)  hotels)  tours)          │
│                                                             │
│              [Not logged in]       [Logged in]              │
│              ┌─────────┐          ┌─────────┐              │
│              │ Login   │          │  [Avatar]▼             │
│              │ Register│          │ ┌─────────────┐        │
│              └─────────┘          │ │ Profile     │        │
│                                   │ │ My Bookings │        │
│                                   │ │ ─────────── │        │
│                                   │ │ Admin Panel │        │
│                                   │ │ (if admin)  │        │
│                                   │ │ ─────────── │        │
│                                   │ │ Logout      │        │
│                                   │ └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Autocomplete Fields

| Page | Fields | Suggests from |
|------|--------|---------------|
| Home (/) | Flight From/To, Hotel Destination, Tour Destination | API search with 250ms debounce |
| /flights | From, To | `departureCity` / `arrivalCity` from flight records |
| /hotels | Destination | `name` from hotel records via `search` param |
| /tours | Destination | `name` from tour records via `search` param |

All other inputs (date, number, select, price range) are manual entry.
