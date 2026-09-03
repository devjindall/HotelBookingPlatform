# 🏨 Komorebi Stays — Full-Stack Hotel Booking Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Tests](https://img.shields.io/badge/Tests-24%2F24%20Passing-15803D?logo=checkmarx&logoColor=white)](./backend/test_integration.js)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A full-stack hotel booking platform built from first principles to demonstrate **relational database consistency (ACID transactions)**, **mathematical date-interval availability algorithms**, **zero-trust backend pricing**, and a **decoupled multilingual AI recommendation assistant**.

---

## 📌 Project Overview & Engineering Highlights

This application is designed with clean, defensible full-stack software engineering practices:

* 🛡️ **Zero-Trust Backend Pricing**: The client never calculates rates. Stay duration (`nights = check_out - check_in`) and total cost (`nights * price_per_night`) are calculated strictly on the backend using database records.
* ⚡ **ACID Transactional Booking (`FOR UPDATE`)**: Eliminates race conditions and overbooking when multiple users attempt to reserve the last available physical room unit concurrently.
* 📅 **Mathematical Date Overlap Algorithm**: Resolves date collisions via `existing.check_in < requested.check_out AND existing.check_out > requested.check_in`, correctly handling same-day guest turnarounds.
* 🤖 **Decoupled AI Travel Assistant**: Converts natural language prompts (English & Japanese) into validated structured JSON filters. **Zero SQL injection or hallucination risk** — records are always queried from MySQL.
* 🔐 **Stateless JWT Authentication & Ownership Guards**: Passwords hashed with salted bcrypt (10 rounds); endpoints strictly verify resource ownership (`req.user.id === booking.user_id`) to block unauthorized cancellations.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["React Frontend (Vite + SPA)"]
    API["Express REST API (Node.js)"]
    AuthMW["JWT Auth & Ownership Middleware"]
    Controllers["Controllers & Business Logic"]
    AISvc["AI Service (Gemini API + Offline NLP)"]
    MySQL[("MySQL 8.0 Relational DB")]

    Client -->|HTTP / JSON Requests| API
    API --> AuthMW
    AuthMW --> Controllers
    Controllers -->|Parameterized SQL| MySQL
    Client -->|Natural Language Prompt (EN / JA)| API
    API --> AISvc
    AISvc -->|Structured Filter JSON| Controllers
    Controllers -->|Validate & Query Real Properties| MySQL
```

---

## 🗄️ Relational Database Schema & Entity Relationships

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

### Key Foreign Key Constraints:
* `rooms.hotel_id -> hotels.id` (`ON DELETE CASCADE`): Deleting a property automatically removes its associated room categories.
* `bookings.user_id -> users.id` (`ON DELETE RESTRICT`): Preserves historical reservation audit trails.
* `bookings.room_id -> rooms.id` (`ON DELETE RESTRICT`): Prevents deleting rooms tied to historical reservations.
* **Room Inventory Semantics**: Each row in `rooms` represents a **category** (e.g., *Superior Double Room*), and `total_rooms` specifies the physical unit count.

```text
Available Inventory = total_rooms - Active Overlapping Confirmed Bookings
```

---

## 💡 Key Architectural Decisions & Engineering Trade-offs

### 1. Why Relational MySQL over NoSQL?
> **Design Choice**: Hotel reservations require strict **ACID transactions** and relational integrity. If two guests reserve the last unit simultaneously, MySQL transactions with `FOR UPDATE` row locks guarantee sequential isolation and prevent overbooking. Foreign key constraints prevent orphaned records, and relational JOINs allow efficient aggregation of starting prices and live inventory.

### 2. Concurrency Control with Row-Level Locking
> **Design Choice**: To eliminate race conditions without external caching layers, the backend wraps booking creation inside a database transaction:
```sql
START TRANSACTION;

-- 1. Lock room row to serialize concurrent booking attempts
SELECT id, price_per_night, total_rooms, capacity 
FROM rooms 
WHERE id = ? 
FOR UPDATE;

-- 2. Count active overlapping confirmed bookings
SELECT COUNT(*) AS booked_count 
FROM bookings 
WHERE room_id = ? 
  AND status = 'CONFIRMED'
  AND check_in < ? 
  AND check_out > ?;

-- 3. If (booked_count >= total_rooms) -> ROLLBACK; return 409 Conflict.
-- Else -> INSERT INTO bookings (...) VALUES (...); COMMIT; return 201 Created.
```

### 3. Mathematical Date-Interval Availability Algorithm
> **Design Choice**: Rather than relying on naive date matching, date collisions are evaluated mathematically:
```text
existing.check_in < requested.check_out AND existing.check_out > requested.check_in
```
> This correctly accommodates **same-day turnarounds** (Guest A checking out on June 15 and Guest B checking in on June 15 evaluate to `FALSE`, allowing both bookings).

```sql
SELECT 
    r.id,
    r.hotel_id,
    r.room_type,
    r.capacity,
    r.price_per_night,
    r.total_rooms,
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

### 4. Zero-Trust Backend Rate & Duration Calculation
> **Design Choice**: In compliance with web application security best practices, the client is never trusted for pricing. The backend queries `price_per_night` directly from the database, computes `nights = check_out - check_in`, and multiplies `nights * price_per_night`.

### 5. Decoupled AI Travel Assistant Architecture
> **Design Choice**: The AI acts purely as a natural language intent extractor, outputting a structured JSON filter object (`city`, `maxPrice`, `guests`, `breakfast`). The backend validates these attributes and runs parameterized SQL queries. The LLM **never touches raw SQL and cannot invent hotel records**. A built-in regex NLP engine ensures 100% functionality offline without external API keys.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate & return signed JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer Token |
| `GET` | `/api/hotels` | List hotels with dynamic filtering (`city`, `maxPrice`, `minRating`, `breakfast`, `guests`, `search`) | Public |
| `GET` | `/api/hotels/:id` | Fetch hotel details & room categories | Public |
| `GET` | `/api/hotels/:hotelId/rooms` | Calculate live room availability for stay dates | Public |
| `POST` | `/api/bookings` | Atomically create reservation | Bearer Token |
| `GET` | `/api/bookings` | Fetch user's booking history | Bearer Token |
| `GET` | `/api/bookings/:id` | Fetch single booking (ownership verified) | Bearer Token |
| `PATCH`| `/api/bookings/:id/cancel` | Cancel active booking & release inventory | Bearer Token |
| `POST` | `/api/ai/recommend` | Natural language intent extraction to MySQL search | Public |

---

## 🚀 Quick Setup & Installation

### Prerequisites
* Node.js 18+ & MySQL Server 8.0+

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in DB credentials in .env
npm start
# Backend running at http://localhost:5000 (Health Check: http://localhost:5000/api/health)
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend running at http://localhost:3000
```

---

## 🧪 Automated Testing Suite

Run the 24-point end-to-end integration test suite:
```bash
cd backend
node test_integration.js
```

```text
========================================================
🧪 RUNNING FULL-STACK INTEGRATION TEST SUITE (PHASE 9)
========================================================

▶ [1/6] System Health & DB Connection: PASS (200 OK)
▶ [2/6] Auth, Duplicate Prevention, JWT & Profile: PASS (6/6)
▶ [3/6] Hotel Catalog, Dynamic Filters & Search: PASS (5/5)
▶ [4/6] Room Availability & Date Overlap Logic: PASS (3/3)
▶ [5/6] Transactions, Overbooking Guards & Ownership: PASS (7/7)
▶ [6/6] Multilingual AI Recommendation Engine: PASS (2/2)

========================================================
🏁 TEST SUMMARY: 24 Passed, 0 Failed (100% Success)
========================================================
```

---

## 🔑 Demo Test Accounts

| Account | Email | Password | Pre-seeded Notes |
|---|---|---|---|
| **Kenji Sato** | `kenji.sato@example.com` | `password123` | Has 3 pre-seeded bookings (Tokyo & Osaka) |
| **Aoi Tanaka** | `aoi.tanaka@example.com` | `password123` | Active & cancelled bookings |
| **Alex Morgan** | `alex.morgan@example.com` | `password123` | Kyoto ryokan booking |
| **Yuki Takahashi** | `yuki.takahashi@example.com` | `password123` | Roppongi skyline booking |

---

## 📄 License & Dataset Attribution

This project is licensed under the [MIT License](LICENSE).  
The dataset is curated synthetic demo data designed specifically for educational and portfolio demonstration. Image assets are royalty-free photos from Unsplash.
