# 🏨 Komorebi Stays — Full-Stack Hotel Booking Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Tests](https://img.shields.io/badge/Tests-24%2F24%20Passing-15803D?logo=checkmarx&logoColor=white)](./backend/test_integration.js)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A full-stack hospitality & travel platform engineered to demonstrate **relational database consistency (ACID transactions)**, **mathematical date-interval availability algorithms**, **zero-trust backend pricing**, and a **decoupled multilingual AI recommendation assistant**.

---

## 📌 Executive Summary & Key Highlights

This project was built from scratch without bloated frameworks to ensure every design choice, SQL query, and architecture pattern can be personally defended in technical interviews.

* 🛡️ **Zero-Trust Backend Pricing**: Frontend never calculates rates. Duration ($nights = \text{check\_out} - \text{check\_in}$) and total cost ($nights \times rate$) are calculated strictly in Express using MySQL records.
* ⚡ **ACID Transactional Booking (`FOR UPDATE`)**: Prevents race conditions and overbooking when multiple concurrent users attempt to reserve the last physical room unit.
* 📅 **Mathematical Date Overlap Algorithm**: Resolves booking collisions via $\text{existing.in} < \text{requested.out} \land \text{existing.out} > \text{requested.in}$, seamlessly supporting same-day turnover.
* 🤖 **Decoupled AI Travel Assistant**: Converts natural language in English & Japanese into validated structured JSON filters. **Zero SQL injection or hallucination risk** — actual records are always fetched from MySQL.
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

### Foreign Key Constraints & Inventory Model:
* `rooms.hotel_id -> hotels.id` with `ON DELETE CASCADE`: Deleting a property safely removes its associated room categories.
* `bookings.user_id -> users.id` with `ON DELETE RESTRICT`: Preserves booking audit history.
* `bookings.room_id -> rooms.id` with `ON DELETE RESTRICT`: Prevents accidental deletion of rooms tied to historical reservations.
* **Room Inventory Semantics**: Each row in `rooms` represents a **category** (e.g., *Superior Double Room*), and `total_rooms` specifies the physical unit count.

$$\text{Available Inventory} = \text{total\_rooms} - \text{Active Overlapping Confirmed Bookings}$$

---

## 🧠 Core Engineering & SQL Deep Dives

### 1. The Booking Interval Overlap Query
Two date intervals $[A_{in}, A_{out}]$ and $[B_{in}, B_{out}]$ collide if and only if:
$$\text{existing.check\_in} < \text{requested.check\_out} \quad \text{AND} \quad \text{existing.check\_out} > \text{requested.check\_in}$$

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

---

### 2. ACID Concurrency Control with Row Locking
```sql
START TRANSACTION;

-- 1. Lock room category row to block concurrent race conditions
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

-- 3. If (booked_count >= total_rooms) -> ROLLBACK with 409 Conflict.
-- Else -> INSERT INTO bookings (...) VALUES (...); COMMIT with 201 Created.
```

---

### 3. Decoupled AI Recommendation Pipeline
```text
User Natural Language (EN / JA)
               ↓
    POST /api/ai/recommend
               ↓
   AI extracts structured JSON
   {"city": "Tokyo", "guests": 2, "maxPrice": 15000, "breakfast": true}
               ↓
 Backend validates values & types
               ↓
   Parameterized MySQL Query
               ↓
    Verified Real Properties
```

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

## 🎯 Placement Interview Defense & FAQ

<details>
<summary><strong>Q1: Why MySQL/Relational DB over MongoDB/NoSQL?</strong></summary>

> **Answer**: Booking platforms require strict **ACID transactional guarantees** and relational integrity. If two guests attempt to reserve the last available room at the same time, MySQL transactions with `FOR UPDATE` row locks guarantee sequential isolation and prevent overbooking. Foreign keys (`ON DELETE CASCADE` / `RESTRICT`) prevent orphaned reservation records.
</details>

<details>
<summary><strong>Q2: How does the system handle booking collisions and same-day turnover?</strong></summary>

> **Answer**: We use the mathematical interval overlap formula:
> $$\text{existing.in} < \text{requested.out} \land \text{existing.out} > \text{requested.in}$$
> If Guest A checks out at 11:00 AM on June 15 and Guest B checks in at 3:00 PM on June 15, the condition $\text{existing.in (June 10)} < \text{requested.out (June 18)}$ is true, but $\text{existing.out (June 15)} > \text{requested.in (June 15)}$ evaluates to `FALSE`. Thus, same-day turnover is correctly recognized as non-overlapping.
</details>

<details>
<summary><strong>Q3: Why does the backend calculate booking prices instead of the frontend?</strong></summary>

> **Answer**: Adhering to the **Zero-Trust Security Principle**, client-provided prices must never be trusted as users can tamper with HTTP payloads. The backend calculates $nights = \text{check\_out} - \text{check\_in}$ and multiplies $nights \times rate$ fetched directly from the database.
</details>

<details>
<summary><strong>Q4: How does the AI assistant prevent hallucination and SQL injection?</strong></summary>

> **Answer**: The AI is strictly an **intent parser**, not an executor. It outputs a pure JSON object containing structured filters (`city`, `maxPrice`, `guests`, `breakfast`). The backend validates these attributes and runs parameterized SQL queries. The LLM never touches raw SQL and never invents hotel records.
</details>

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
The dataset is curated synthetic demo data designed specifically for educational and interview evaluation. Image assets are royalty-free photos from Unsplash.
