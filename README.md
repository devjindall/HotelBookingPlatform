# Komorebi Stays - Full-Stack Hotel Booking Platform

A placement-ready, full-stack hotel booking platform built with **React (Vite) + Node.js/Express + MySQL + JWT Authentication + Backend AI Recommendation Assistant**.

---

## 1. Project Overview

**Komorebi Stays** is a production-grade full-stack travel platform designed to demonstrate robust backend engineering, relational database consistency, strict zero-trust pricing, date-interval availability logic, and practical decoupled AI integration.

### Core Features:
- **Authentication & Authorization**: Registration, login, password hashing (`bcryptjs`), stateless JWT token verification, and strict resource ownership checks.
- **Hotel Discovery & Filtering**: Real-time multi-criteria filtering across **Tokyo**, **Kyoto**, and **Osaka** (Destination, Max Price slider, Min Rating, Breakfast availability, Guest capacity, and Keyword search).
- **Room Availability Engine**: Mathematical date-overlap calculation (`check_in < requested_out AND check_out > requested_in`) accounting for multi-unit physical room inventory (`total_rooms`).
- **Transactional Booking & Cancellation**: ACID-compliant booking creation using MySQL transactions (`START TRANSACTION`, `FOR UPDATE`, `COMMIT`/`ROLLBACK`), backend duration & price calculation ($nights \times rate$), and one-click cancellation.
- **Decoupled AI Recommendation Assistant**: Multilingual natural language assistant (English & Japanese) that extracts structured JSON search criteria and queries verified MySQL properties without SQL injection or hallucination risks.

---

## 2. System Architecture

```mermaid
graph TD
    Client["React Frontend (Vite + Vanilla CSS)"]
    API["Express REST API (Node.js)"]
    AuthMW["JWT Auth & Ownership Middleware"]
    Controllers["Controllers & Business Logic"]
    AISvc["AI Service (Gemini API + Regex Fallback)"]
    MySQL[("MySQL 8.0+ Database")]

    Client -->|HTTP / JSON Requests| API
    API --> AuthMW
    AuthMW --> Controllers
    Controllers -->|Parameterized SQL (mysql2/promise)| MySQL
    Client -->|Natural Language Prompt (EN / JA)| API
    API --> AISvc
    AISvc -->|Structured Filter JSON| Controllers
    Controllers -->|Validate & Query Real Properties| MySQL
```

---

## 3. Technology Stack

| Layer | Technology | Rationale & Responsibility |
|---|---|---|
| **Frontend** | React 18, Vite, React Router 6, Lucide Icons | Fast SPA rendering, component modularity, client-side routing, responsive UI. |
| **Backend** | Node.js, Express.js | Lightweight, non-blocking asynchronous REST API server. |
| **Database** | MySQL 8.0+ (`mysql2/promise`) | ACID transactions, foreign key constraints, indexes, connection pooling. |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` | Salted password hashing (10 rounds) and stateless token authorization. |
| **AI Integration** | Google Gemini API + Local Multilingual Rule Engine | Natural language intent extraction to structured JSON filters with 100% offline fallback. |

---

## 4. Project Directory Structure

```text
Hotel Booking Platform/
├── backend/
│   ├── config/
│   │   └── db.js                 # mysql2 connection pool with promise support
│   ├── controllers/
│   │   ├── authController.js     # Register, Login, Current User
│   │   ├── hotelController.js    # Catalog, filters, single hotel, rooms availability
│   │   ├── bookingController.js  # Transactional booking, history, cancellation
│   │   └── aiController.js       # Natural language intent -> MySQL query
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & req.user extraction
│   │   └── errorHandler.js       # Centralized error handler & status codes
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/*
│   │   ├── hotelRoutes.js        # /api/hotels/*
│   │   ├── bookingRoutes.js      # /api/bookings/*
│   │   └── aiRoutes.js           # /api/ai/*
│   ├── services/
│   │   └── aiService.js          # LLM structured prompt + offline regex NLP parser
│   ├── test_integration.js       # Automated 24-point end-to-end integration test suite
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express app bootstrap & route mounting
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Responsive navigation & auth dropdown
│   │   │   ├── Footer.jsx        # Project attribution & sitemap
│   │   │   ├── HotelCard.jsx     # Catalog hotel card with pricing & rating
│   │   │   ├── RoomCard.jsx      # Room categories with live inventory badge
│   │   │   ├── SearchBar.jsx     # Quick search (city, dates, guests)
│   │   │   ├── FilterPanel.jsx   # Sidebar filters (price, rating, breakfast)
│   │   │   ├── BookingCard.jsx   # Booking history item with cancel action
│   │   │   ├── ProtectedRoute.jsx# Auth route guard
│   │   │   └── AIRecommendationBox.jsx # Multilingual prompt input with sample chips
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global user state & JWT localStorage sync
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Hero, destination cards, top rated stays
│   │   │   ├── Hotels.jsx        # Full catalog + search + dynamic filter panel
│   │   │   ├── HotelDetails.jsx  # Hotel imagery, description, rooms selector
│   │   │   ├── Booking.jsx       # Zero-trust checkout review & confirmation
│   │   │   ├── MyBookings.jsx    # User's booking history & cancellation
│   │   │   ├── AIRecommend.jsx   # Dedicated AI Travel Assistant page
│   │   │   ├── Login.jsx         # Sign in with quick-fill demo credentials
│   │   │   └── Register.jsx      # New account registration
│   │   ├── services/
│   │   │   └── api.js            # Universal fetch client with auth token injection
│   │   ├── styles/
│   │   │   ├── global.css        # Hospitality design system & CSS variables
│   │   │   ├── navbar.css
│   │   │   ├── hotels.css
│   │   │   ├── details.css
│   │   │   ├── booking.css
│   │   │   ├── ai.css
│   │   │   └── auth.css
│   │   ├── App.jsx               # App routing configuration
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   ├── schema.sql                # Complete relational DDL (tables, FKs, indexes, checks)
│   ├── seed.sql                  # Curated synthetic demo data (20 Japan hotels, 50 rooms, 10 bookings)
│   └── README.md                 # Database setup & SQL query explanations
│
├── .gitignore
└── README.md                     # Comprehensive documentation & interview defense guide
```

---

## 5. Database Schema & Entity Relationships

```text
  +------------------+         1 : N         +-------------------+
  |      USERS       | --------------------> |     BOOKINGS      |
  |------------------|                       |-------------------|
  | PK  id           |                       | PK  id            |
  |     name         |                       | FK  user_id       | ----+
  | UQ  email        |                       | FK  room_id       | --+ |
  |     password_hash|                       |     check_in      |   | |
  |     created_at   |                       |     check_out     |   | |
  |     updated_at   |                       |     guests        |   | |
  +------------------+                       |     total_price   |   | |
                                             |     status        |   | |
                                             +-------------------+   | |
                                                                     | |
  +------------------+         1 : N         +-------------------+   | |
  |      HOTELS      | --------------------> |       ROOMS       | <-+ |
  |------------------|                       |-------------------|     |
  | PK  id           |                       | PK  id            |     |
  |     name         |                       | FK  hotel_id      |     |
  |     city         |                       |     room_type     |     |
  |     address      |                       |     capacity      |     |
  |     description  |                       |     price_per_night|    |
  |     rating       |                       |     total_rooms   |     |
  |     breakfast    |                       +-------------------+     |
  +------------------+                                                 |
           |                                                           |
           +-----------------------------------------------------------+
```

### Foreign Key Actions:
- `rooms.hotel_id -> hotels.id` with `ON DELETE CASCADE` (deleting a hotel removes its room inventory categories).
- `bookings.user_id -> users.id` with `ON DELETE RESTRICT` (preserves historical reservation audit records).
- `bookings.room_id -> rooms.id` with `ON DELETE RESTRICT` (prevents deleting rooms associated with past or active reservations).

---

## 6. Understanding the Room Inventory Model (`total_rooms`)

In real-world hospitality architecture, each row in the `rooms` table represents a **Room Type / Inventory Category** (e.g., *Superior Double Room*), while `total_rooms` defines how many identical physical units exist for that category.

$$\text{Available Inventory} = \text{total\_rooms} - \text{Active Overlapping Confirmed Bookings}$$

A reservation is permitted if and only if $\text{Available Inventory} \ge 1$.

---

## 7. Key SQL Queries Explained

### A. Dynamic Hotel Catalog & Multi-Parameter Filter
```sql
SELECT 
    h.id,
    h.name,
    h.city,
    h.address,
    h.description,
    h.rating,
    h.breakfast_available,
    h.image_url,
    MIN(r.price_per_night) AS min_price,
    MAX(r.capacity) AS max_capacity,
    COUNT(DISTINCT r.id) AS room_types_count
FROM hotels h
LEFT JOIN rooms r ON h.id = r.hotel_id
WHERE (? IS NULL OR LOWER(h.city) = LOWER(?))
  AND (? IS NULL OR h.rating >= ?)
  AND (? IS NULL OR h.breakfast_available = ?)
  AND (? IS NULL OR r.capacity >= ?)
  AND (? IS NULL OR (h.name LIKE ? OR h.city LIKE ? OR h.description LIKE ?))
GROUP BY h.id, h.name, h.city, h.address, h.description, h.rating, h.breakfast_available, h.image_url
HAVING (? IS NULL OR MIN(r.price_per_night) <= ?)
ORDER BY h.rating DESC, h.name ASC;
```

---

### B. Room Availability Interval-Overlap Query
Two date intervals $[A_{in}, A_{out}]$ and $[B_{in}, B_{out}]$ overlap if and only if:
$$\text{existing.check\_in} < \text{requested.check\_out} \quad \text{AND} \quad \text{existing.check\_out} > \text{requested.check\_in}$$

*Same-day turnover* (Guest A checks out on June 15, Guest B checks in on June 15) evaluates to `FALSE` and is therefore completely valid.

```sql
SELECT 
    r.id,
    r.hotel_id,
    r.room_type,
    r.capacity,
    r.price_per_night,
    r.total_rooms,
    r.description,
    COALESCE(b.booked_count, 0) AS booked_count,
    (r.total_rooms - COALESCE(b.booked_count, 0)) AS available_rooms,
    CASE WHEN (r.total_rooms - COALESCE(b.booked_count, 0)) > 0 THEN TRUE ELSE FALSE END AS is_available
FROM rooms r
LEFT JOIN (
    SELECT room_id, COUNT(*) AS booked_count
    FROM bookings
    WHERE status = 'CONFIRMED'
      AND check_in < ?   /* Requested checkOut */
      AND check_out > ?  /* Requested checkIn */
    GROUP BY room_id
) b ON r.id = b.room_id
WHERE r.hotel_id = ?
ORDER BY r.price_per_night ASC;
```

---

### C. Atomic Transaction with Row Lock (`FOR UPDATE`)
```sql
START TRANSACTION;

-- 1. Lock the room row to prevent concurrent race conditions
SELECT id, price_per_night, total_rooms, capacity 
FROM rooms 
WHERE id = ? 
FOR UPDATE;

-- 2. Check active overlapping confirmed bookings
SELECT COUNT(*) AS booked_count 
FROM bookings 
WHERE room_id = ? 
  AND status = 'CONFIRMED'
  AND check_in < ? 
  AND check_out > ?;

-- 3. If (booked_count >= total_rooms) -> ROLLBACK; return 409 Conflict.
-- Else -> INSERT INTO bookings (...) VALUES (...); COMMIT; return 201 Created.
```

---

## 8. REST API Documentation

### Auth Endpoints
| Method | Endpoint | Description | Auth Required | Body |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | No | `{ name, email, password }` |
| `POST` | `/api/auth/login` | Log in and receive JWT | No | `{ email, password }` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes (Bearer) | None |

### Hotel Endpoints
| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/hotels` | List hotels with dynamic filtering | `city`, `maxPrice`, `minRating`, `breakfast`, `guests`, `search` |
| `GET` | `/api/hotels/:id` | Fetch single hotel details & room categories | None |
| `GET` | `/api/hotels/:hotelId/rooms` | Fetch rooms with dynamic date availability | `checkIn`, `checkOut`, `guests` |

### Booking Endpoints
| Method | Endpoint | Description | Auth Required | Body / Path |
|---|---|---|---|---|
| `POST` | `/api/bookings` | Atomically create reservation | Yes (Bearer) | `{ roomId, checkIn, checkOut, guests }` |
| `GET` | `/api/bookings` | Get user's own booking history | Yes (Bearer) | None (derived from JWT) |
| `GET` | `/api/bookings/:id` | Get single reservation details (ownership verified) | Yes (Bearer) | `id` in path |
| `PATCH`| `/api/bookings/:id/cancel` | Cancel an active reservation | Yes (Bearer) | `id` in path |

### AI Recommendation Endpoint
| Method | Endpoint | Description | Auth Required | Body |
|---|---|---|---|---|
| `POST` | `/api/ai/recommend` | Multilingual intent extraction -> MySQL search | No | `{ prompt: "Tokyo under 15000 yen for 2 guests" }` |

---

## 9. Setup Instructions

### Prerequisites
- Node.js 18.x or higher
- MySQL Server 8.0+

### Step 1: Database Setup
1. Open terminal and run:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```

### Step 2: Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   npm install
   ```
2. Configure `.env` (a template is provided in `.env.example`):
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=hotel_booking_db
   DB_PORT=3306
   JWT_SECRET=your_super_secret_jwt_key
   # Optional: Google Gemini API Key (falls back to local NLP parser if blank)
   GEMINI_API_KEY=
   ```
3. Start the backend:
   ```bash
   npm run dev   # (or: node server.js)
   ```

### Step 3: Frontend Setup
1. In a separate terminal, navigate to frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at `http://localhost:3000`.

---

## 10. Seeded Test Accounts

| User Name | Email | Password | Pre-seeded Bookings |
|---|---|---|---|
| **Kenji Sato** | `kenji.sato@example.com` | `password123` | 3 bookings in Tokyo & Osaka |
| **Aoi Tanaka** | `aoi.tanaka@example.com` | `password123` | Active & cancelled reservations |
| **Alex Morgan** | `alex.morgan@example.com` | `password123` | Active Kyoto ryokan stay |
| **Yuki Takahashi** | `yuki.takahashi@example.com` | `password123` | Roppongi skyline booking |

---

## 11. Comprehensive Interview Defense & FAQ Guide

### Q1: Why MySQL and a relational database instead of MongoDB/NoSQL?
> **Answer**: Hotel booking platforms are fundamentally **relational and transactional**. 
> 1. We require strict ACID guarantees: availability checking and reservation insertion must execute atomically so two users cannot book the last available room simultaneously.
> 2. Relational foreign key constraints (`ON DELETE CASCADE` on rooms, `ON DELETE RESTRICT` on bookings) prevent orphaned reservation records.
> 3. Complex relational JOINs between `hotels`, `rooms`, and `bookings` allow aggregations like dynamic pricing and remaining room availability directly at the database engine level.

### Q2: How does the room inventory model work (`rooms` vs `total_rooms`)?
> **Answer**: In our relational schema, each row in `rooms` represents a **Room Category** (e.g., *Deluxe Twin Room* at Hotel 1) rather than a single physical key. The `total_rooms` column defines the total units in inventory (e.g., 6 units). The system dynamically counts active confirmed reservations overlapping the requested stay window and subtracts them from `total_rooms`.

### Q3: How is room availability calculated without date collision bugs?
> **Answer**: We use the mathematical interval-overlap formula:
> $$\text{existing.check\_in} < \text{requested.check\_out} \quad \text{AND} \quad \text{existing.check\_out} > \text{requested.check\_in}$$
> This avoids simplistic date equals checks. It also correctly treats checkout day turnover as available (Guest A leaves at 11:00 AM on June 15; Guest B arrives at 3:00 PM on June 15 $\rightarrow$ no overlap).

### Q4: Why does the backend calculate the booking price instead of the frontend?
> **Answer**: Following the **Zero-Trust Security Principle**, the client cannot be trusted for pricing or duration calculations. Malicious users could easily modify HTTP payloads in DevTools (e.g., sending `total_price: 1`). The backend fetches the authentic `price_per_night` directly from MySQL, calculates $nights = \text{check\_out} - \text{check\_in}$, and multiplies $nights \times rate$.

### Q5: Why are MySQL transactions (`START TRANSACTION`, `FOR UPDATE`) required?
> **Answer**: To eliminate race conditions. If Hotel A has only 1 Deluxe Suite left and two users click "Reserve" at the exact same millisecond:
> Without transactions and row-locking, both requests would read `booked_count = 0` and both would insert a booking (overbooking the room).
> With `SELECT ... FOR UPDATE`, the first transaction locks the room row. The second transaction waits until the first commits, after which it re-evaluates `booked_count = 1`, detects zero remaining units, rolls back, and returns `409 Conflict`.

### Q6: What is the exact difference between Authentication and Authorization?
> **Answer**:
> - **Authentication**: Verifying *who you are* (e.g., validating email and password hash via bcrypt, and issuing a signed JWT).
> - **Authorization**: Verifying *what you have permission to do* (e.g., ensuring User B cannot view or cancel User A's reservation by checking `booking.user_id === req.user.id`).

### Q7: How does the AI recommendation feature work safely?
> **Answer**: 
> 1. The AI is strictly an **intent parser**, not a database executor.
> 2. The user's natural language (in English or Japanese) is converted into a structured JSON filter object (`city`, `maxPrice`, `guests`, `breakfast`).
> 3. The backend validates these attributes against strict ranges and executes a parameterized SQL query on MySQL.
> 4. The AI **never touches raw SQL**, **never invents hotels**, and **never invents prices**.
> 5. If the AI service times out or is offline, our built-in multilingual regex parser steps in seamlessly.

---

## 12. Testing Verification

Run the automated 24-point end-to-end integration test suite:
```bash
cd backend
node test_integration.js
```

### Test Suite Output:
```text
========================================================
🧪 RUNNING FULL-STACK INTEGRATION TEST SUITE (PHASE 9)
========================================================

▶ [1/6] Testing System Health & Database Connectivity...
  [PASS] GET /api/health verifies MySQL connection

▶ [2/6] Testing Authentication & Authorization Pipeline...
  [PASS] POST /api/auth/register creates user and issues JWT
  [PASS] Duplicate email registration rejected with 409 Conflict
  [PASS] Invalid password rejected with 401 Unauthorized
  [PASS] Valid login issues signed JWT
  [PASS] GET /api/auth/me returns authenticated profile
  [PASS] Login with seeded user (Kenji Sato) successful

▶ [3/6] Testing Hotel Discovery & Combined Filters...
  [PASS] GET /api/hotels returns all 20 curated properties
  [PASS] City filter (Tokyo) returns exactly 8 hotels
  [PASS] Combined filter (Kyoto + rating >= 4.5 + breakfast) works accurately
  [PASS] Max price filter (<= ¥9,500) works accurately
  [PASS] GET /api/hotels/1 returns hotel with 4 room categories

▶ [4/6] Testing Room Availability & Date Overlap Mathematics...
  [PASS] Availability calculation handles multi-unit inventory (6 total - 2 booked = 4 available)
  [PASS] Non-overlapping future dates return full inventory (6 available)
  [PASS] Invalid date range rejected with 400 Bad Request

▶ [5/6] Testing Transactional Booking & Ownership Protection...
  [PASS] Create booking calculates 3 nights * ¥9,500 = ¥28,500 with 201 Created
  [PASS] Booking with guests > room.capacity rejected with 400 Bad Request
  [PASS] GET /api/bookings returns newly created reservation for the user
  [PASS] Cross-user booking access rejected with 403 Forbidden
  [PASS] Cross-user booking cancellation rejected with 403 Forbidden
  [PASS] Owner cancelling own booking succeeds with 200 OK
  [PASS] Repeat cancellation on cancelled booking rejected with 400 Bad Request

▶ [6/6] Testing Multilingual AI Travel Assistant...
  [PASS] English AI prompt extracts structured preferences and returns real MySQL hotels
  [PASS] Japanese AI prompt extracts structured preferences and returns real MySQL hotels

========================================================
🏁 TEST SUMMARY: 24 Passed, 0 Failed
========================================================
```

---

## 13. License & Synthetic Dataset Disclaimer

The dataset in `database/seed.sql` is a curated synthetic demo dataset designed specifically for placement demonstration and educational portfolio review. No proprietary or commercial booking aggregators were scraped. Image assets are royalty-free photos from Unsplash.
