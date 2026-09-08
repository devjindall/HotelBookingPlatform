# Database Setup

This folder contains the MySQL schema and sample data used by the Hotel Booking Platform.

## Setup

Make sure MySQL 8+ is installed and running.

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

You can verify the setup with:

```sql
USE hotel_booking_db;
SHOW TABLES;
SELECT COUNT(*) FROM hotels;
SELECT COUNT(*) FROM rooms;
SELECT COUNT(*) FROM bookings;
```

## Database Structure

The main tables are:

- `users` — registered users
- `hotels` — hotel information
- `rooms` — room types and inventory counts
- `bookings` — reservations made by users

The tables are connected using foreign keys. A room belongs to a hotel, and a booking belongs to a user and a room.

## Room Inventory

A row in `rooms` represents a room type rather than one physical room. `total_rooms` stores how many units of that room type are available.

For a requested date range, the application counts confirmed bookings that overlap those dates and compares the count with `total_rooms`.

Two bookings overlap when:

```text
existing.check_in < requested.check_out
AND existing.check_out > requested.check_in
```

This means a guest checking out on the same day another guest checks in does not block the new booking.

## Booking Transaction

Creating a booking is handled inside a MySQL transaction. The selected room row is locked with `FOR UPDATE` before availability is checked and the booking is inserted.

This makes concurrent attempts to book the last available unit run one at a time.

The simplified flow is:

```text
START TRANSACTION
    ↓
Lock room row
    ↓
Check overlapping bookings
    ↓
Check available units
    ↓
Create booking
    ↓
COMMIT
```

## Sample Data

`seed.sql` contains synthetic data for local development and testing. The hotel information is sample data rather than data collected from a commercial booking service.

The seed file also creates demo users for testing the application locally.
