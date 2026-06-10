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
│                      ADMIN / AGENT ROUTES                         │
├──────────────┬──────────┬──────────┬──────────┬──────────┬─────┤
│ Dashboard    │ Flights  │ Hotels   │ Tours    │ Bookings │ ... │
│ /admin       │/admin/   │ /admin/  │ /admin/  │ /admin/  │     │
│              │ flights  │ hotels   │ tours    │ bookings │     │
├──────────────┴──────────┴──────────┴──────────┴──────────┴─────┤
│ AGENT + ADMIN: /admin/flights, /admin/hotels, /admin/tours,    │
│                /admin/bookings, /admin/api-keys                 │
│ ADMIN ONLY:    /admin/users, /admin/destinations               │
└────────────────────────────────────────────────────────────────┘
```

Clean routes `/flights`, `/hotels`, `/tours` each use the shared `SearchView` component with type-specific filters.

### API Integration Page (`/admin/api-keys`)

Two-tab layout:
- **Keys tab** — generate, list, revoke API keys (ta_ prefixed, shown once)
- **Integration Guide tab** — collapsible sections:
  - Getting Started (generate → header → response)
  - API Endpoints (all 5 public endpoints with method/path/params)
  - Code Examples (JavaScript/Fetch, Python/requests, cURL)
  - Best Practices (security, rotation, naming, error handling)

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
      │ ConfirmDialog appears:            │
      │  - Payment Method: Card / Cash    │
      │  - Quantity, Guest Info           │
      │                                   │
      │  If not logged in:                │
      │  → Form saved to sessionStorage   │
      │  → Redirect to /login?redirect=...│
      │  → After login, data restored     │
      │    and dialog reopens             │
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
                     ┌──────────────────────────────────┐
                     │  Detail Page → ConfirmDialog      │
                     │  (no checkout page for cash)     │
                     │                                  │
                     │  Payment method chosen inside    │
                     │  ConfirmDialog on detail page:   │
                     │    • Card (mock)                 │
                     │    • Cash on arrival             │
                     │                                  │
                     │  Card → /booking/checkout/[id]   │
                     │  Cash → /booking/[id] (confirmed)│
                     └───────────┬──────────────────────┘
                                 │
                           Submit Booking
                                 │
                     ┌───────────┴───────────┐
                     ▼                       ▼
            ┌──────────────────┐  ┌──────────────────┐
            │  Card (pending)  │  │ Cash (confirmed) │
            │ /booking/        │  │ /booking/[id]    │
            │ checkout/[id]    │  │                  │
            │                  │  │ - Reference ID   │
            │ - Process payment│  │ - Status: conf.  │
            │ - Confirm status │  │ - Invoice        │
            │ - Mark paid      │  │ - Cancel option  │
            └────────┬─────────┘  └──────────────────┘
                     │
                     ▼
            ┌──────────────────┐
            │  Booking Detail  │
            │ /booking/[id]    │
            │                  │
            │ - Reference ID   │
            │ - Status: conf.  │
            │ - Invoice        │
            │ - Cancel option  │
            └──────────────────┘

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
   │  - Status dropdown (Active/      │
   │    Pending) with ConfirmDialog   │
   │  - Delete with confirmation      │
   │  - Pagination                    │
   └──────────────────────────────────┘

   Flights use SeatEditor (add/remove seat classes)
   Hotels use RoomEditor (add/remove room types)
   Both use useMemo to prevent form reset on re-render
```

## 4a. Agent Flow

```
   Travel Agents manage their own content:
   ┌────────────────────────────────────────┐
   │  Agent Panel (via sidebar/nav)         │
   │                                        │
   │  - Create flights/hotels/tours         │
   │    → isActive = false (Pending)        │
   │    (unless trustLevel = trusted)       │
   │  - Edit own items only                 │
   │  - Deactivate own items only           │
   │  - View own items in admin tables      │
   │  - API Integration page for third-     │
   │    party key management + docs         │
   └────────────────────────────────────────┘

   Agent Trust Tiers:
   ┌────────────────────────────────────────┐
   │  new:      Items need admin approval   │
   │  trusted:  Items auto-active           │
   │                                        │
   │  Auto-upgrade at 5 approved items      │
   └────────────────────────────────────────┘

   Admin management:
   ┌────────────────────────────────────────┐
   │  Approve: PATCH /:id/approve           │
   │  Deactivate: PATCH /:id/deactivate     │
   │  Ban: PATCH /users/:id {isActive:false}│
   │  Status dropdown replaces separate     │
   │    Approve/Deactivate buttons          │
   │  ConfirmDialog on status change        │
   └────────────────────────────────────────┘
```

---

## 5. Payment Flow

```
                    ┌─────────────────────────────┐
                    │    Detail Page               │
                    │ /flights/[id] /hotels/[id]   │
                    │ /tours/[id]                  │
                    │                              │
                    │  "Book Now" → ConfirmDialog  │
                    │  with payment method radio:  │
                    │    ○ Card                    │
                    │    ○ Cash on Arrival         │
                    └───────────┬─────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Card Payment   │  │ Cash on Arrival  │  │ (Future: other)  │
│   (mock)         │  │                  │  │                  │
│                  │  │ - No upfront     │  │                  │
│ - Redirected to  │  │   payment        │  │                  │
│   checkout page  │  │ - Immediate      │  │                  │
│ - Process payment│  │   confirmation   │  │                  │
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
│  (redirect to    │  │  (redirect to    │
│   checkout page) │  │   booking page)  │
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
    │      user,             │                      │
    │      csrfToken }       │                      │
    │◄── httpOnly cookie     │                      │
    │    (refreshToken)      │                      │
    │◄── csrf_token cookie   │                      │
    │    (SameSite=Strict)   │                      │
    │                        │                      │
    │── GET /users/me ──────►│                      │
    │   (Authorization: Bearer <token>)             │
    │   (X-CSRF-Token on     │                      │
    │    mutating requests)  │                      │
    │                        │── verify JWT ────────│
    │◄── user profile ──────│                      │

Booking flow (transactional):
  Browser             Backend                       DB
    │                     │                          │
    │── POST /bookings ──►│                          │
    │                     │── BEGIN TRANSACTION ────►│
    │                     │── atomic decrement ─────►│
    │                     │   (updateMany gte guard) │
    │                     │── create booking ───────►│
    │                     │── create payment ───────►│
    │                     │── create audit log ─────►│
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
│                                   │ │ Logout (with│        │
│                                   │ │  confirm)   │        │
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
