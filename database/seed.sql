-- HOTEL BOOKING PLATFORM - SAMPLE DATA
--
-- Synthetic data for local development and testing.
-- No commercial booking platform data is used.
-- Image URLs point to royalty-free Unsplash photos.
--
-- Room inventory:
-- Each row in `rooms` represents a room type.
-- `total_rooms` is the number of units of that type.

USE hotel_booking_db;

-- Clear existing data before seeding.
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bookings;
TRUNCATE TABLE rooms;
TRUNCATE TABLE hotels;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- SEED USERS
-- Default password for all demo accounts: password123
-- Bcrypt hash generated with 10 salt rounds:
