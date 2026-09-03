# Database Setup & SQL Architecture Guide

This directory contains the complete, reproducible relational database schema and curated seed dataset for the **Hotel Booking Platform**.

---

## 1. Quick Setup Instructions

### Prerequisites
- MySQL Server 8.0+ installed and running.
- MySQL CLI or MySQL Workbench.

### Step-by-Step Initialization

1. **Log in to MySQL:**
   ```bash
   mysql -u root -p
   ```

2. **Execute the Schema (Creates DB, Tables, Constraints & Indexes):**
   ```sql
   SOURCE database/schema.sql;
   ```
   *(Or on Windows cmd/powershell):*
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Execute the Seed Dataset (Inserts Users, Hotels, Rooms & Bookings):**
   ```sql
   SOURCE database/seed.sql;
   ```
   *(Or on Windows cmd/powershell):*
   ```bash
   mysql -u root -p < database/seed.sql
   ```

4. **Verify Table Creation:**
   ```sql
   USE hotel_booking_db;
   SHOW TABLES;
   SELECT COUNT(*) AS total_hotels FROM hotels;
   SELECT COUNT(*) AS total_rooms FROM rooms;
   SELECT COUNT(*) AS total_bookings FROM bookings;
   ```

---

## 2. Dataset Provenance & Licensing Notice

> **Important Disclosure for Portfolio & Interview Defense:**  
> The dataset in `seed.sql` is a **curated synthetic demo dataset** designed specifically for educational demonstration, placement interviews, and realistic system testing.
> - **No commercial websites were scraped** (no data from Booking.com, Agoda, MakeMyTrip, Airbnb, etc.).
> - Hotel addresses, descriptions, ratings, and room inventories are realistically modeled representations of hospitality properties across **Tokyo**, **Kyoto**, and **Osaka**.
> - Photography URLs link to freely usable architectural and travel photos from Unsplash.

---

## 3. Entity-Relationship Model (ERD)

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

### Foreign Key Constraints & Cascading:
- `rooms.hotel_id -> hotels.id`: Defined with `ON DELETE CASCADE` so deleting a hotel automatically removes its associated room categories.
- `bookings.user_id -> users.id`: Defined with `ON DELETE RESTRICT` to preserve booking audit trails.
- `bookings.room_id -> rooms.id`: Defined with `ON DELETE RESTRICT` to prevent accidental deletion of rooms tied to historical reservations.

---

## 4. Understanding the Room Inventory Model (`total_rooms`)

In hospitality systems, a row in the `rooms` table represents a **Room Type / Inventory Category** rather than an individual physical key/room unit.

- **Example**: Hotel 1 has a record for `Superior Double Room` with `capacity = 2`, `price_per_night = 14000`, and `total_rooms = 6`.
- This means the hotel has **6 identical physical units** of this category.
- When evaluating availability for a requested date range:
  $$\text{Available Inventory} = \text{total\_rooms} - \text{Active Overlapping Confirmed Bookings}$$
- A new reservation is permitted as long as $\text{Available Inventory} \ge 1$.

---

## 5. Key SQL Queries Explained

### A. Hotel Catalog with Starting Price (JOIN + Aggregation)
To list all hotels with their minimum room rate and capacity options:
```sql
SELECT 
    h.id,
    h.name,
    h.city,
    h.address,
    h.rating,
    h.breakfast_available,
    h.image_url,
    MIN(r.price_per_night) AS min_price,
    MAX(r.capacity) AS max_capacity
FROM hotels h
JOIN rooms r ON h.id = r.hotel_id
WHERE (? IS NULL OR h.city = ?)
  AND (? IS NULL OR h.rating >= ?)
  AND (? IS NULL OR h.breakfast_available = ?)
  AND (? IS NULL OR r.capacity >= ?)
GROUP BY h.id, h.name, h.city, h.address, h.rating, h.breakfast_available, h.image_url
HAVING (? IS NULL OR MIN(r.price_per_night) <= ?)
ORDER BY h.rating DESC;
```

---

### B. Room Availability Query (The Interval Overlap Formula)

#### The Mathematical Overlap Condition:
Two date ranges $[A_{in}, A_{out}]$ and $[B_{in}, B_{out}]$ collide **if and only if**:
$$A_{in} < B_{out} \quad \text{AND} \quad A_{out} > B_{in}$$

*Note on Turnover*: If a guest checks out on `2026-06-15` and a new guest checks in on `2026-06-15`, the ranges do **not** overlap because the condition $2026\text{-}06\text{-}15 < 2026\text{-}06\text{-}15$ evaluates to `FALSE`.

#### The Inventory Availability SQL Query:
```sql
SELECT 
    r.id AS room_id,
    r.hotel_id,
    r.room_type,
    r.capacity,
    r.price_per_night,
    r.total_rooms,
    COUNT(b.id) AS active_bookings_count,
    (r.total_rooms - COUNT(b.id)) AS remaining_available_rooms
FROM rooms r
LEFT JOIN bookings b 
    ON r.id = b.room_id
    AND b.status = 'CONFIRMED'
    AND b.check_in < ?   /* Requested check_out */
    AND b.check_out > ?  /* Requested check_in */
WHERE r.hotel_id = ?
GROUP BY r.id, r.hotel_id, r.room_type, r.capacity, r.price_per_night, r.total_rooms;
```

---

### C. Atomic Booking Creation with Row-Level Lock

To prevent two concurrent requests from overbooking the last physical unit:
```sql
START TRANSACTION;

-- 1. Lock the room row for the duration of the transaction
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

-- 3. In Application Logic:
-- If (booked_count >= total_rooms) -> ROLLBACK with 409 Conflict.
-- Else -> INSERT INTO bookings (...) VALUES (...); COMMIT;
```

---

## 6. Seeded Test Accounts

| Email | Password | Role | Notes |
|---|---|---|---|
| `kenji.sato@example.com` | `password123` | Demo User | Has 3 pre-seeded bookings (Tokyo & Osaka) |
| `aoi.tanaka@example.com` | `password123` | Demo User | Has active and cancelled bookings |
| `alex.morgan@example.com` | `password123` | Demo User | Has active Kyoto bookings |
| `yuki.takahashi@example.com` | `password123` | Demo User | Has active Tokyo bookings |
