-- ============================================================================
-- HOTEL BOOKING PLATFORM - DATABASE SCHEMA
-- ============================================================================
-- Purpose: Relational database schema for hotel discovery and booking.
-- Database: MySQL 8.0+
-- Encoding: UTF-8 (utf8mb4)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS hotel_booking_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hotel_booking_db;

-- Drop child tables before parent tables to avoid foreign key constraint errors
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS hotels;
DROP TABLE IF EXISTS users;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores registered guest credentials and timestamps.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. HOTELS TABLE
-- Stores hotel properties, ratings, amenities, and location metadata.
-- ----------------------------------------------------------------------------
CREATE TABLE hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rating DECIMAL(2, 1) NOT NULL DEFAULT 4.0,
    breakfast_available BOOLEAN NOT NULL DEFAULT FALSE,
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_hotel_rating CHECK (rating >= 1.0 AND rating <= 5.0),
    INDEX idx_hotels_city (city),
    INDEX idx_hotels_rating (rating),
    INDEX idx_hotels_breakfast (breakfast_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. ROOMS TABLE (ROOM-TYPE INVENTORY CATEGORIES)
-- NOTE FOR INTERVIEWS:
-- Each row in this table represents a 'room type / inventory category'
-- (e.g., 'Deluxe Twin Room' at a specific hotel).
-- The column `total_rooms` defines how many physical units of this
-- room type exist in the hotel's inventory.
-- ----------------------------------------------------------------------------
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    total_rooms INT NOT NULL DEFAULT 1,
    description VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rooms_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    CONSTRAINT chk_room_capacity CHECK (capacity >= 1),
    CONSTRAINT chk_room_price CHECK (price_per_night > 0),
    CONSTRAINT chk_room_total CHECK (total_rooms >= 1),
    INDEX idx_rooms_hotel_id (hotel_id),
    INDEX idx_rooms_capacity (capacity),
    INDEX idx_rooms_price (price_per_night)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. BOOKINGS TABLE
-- Stores reservations made by users for specific room types across date ranges.
-- Status values: 'CONFIRMED' or 'CANCELLED'.
-- `total_price` stores the total calculated cost (nights * price_per_night).
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
    CONSTRAINT chk_booking_dates CHECK (check_out > check_in),
    CONSTRAINT chk_booking_guests CHECK (guests >= 1),
    CONSTRAINT chk_booking_price CHECK (total_price > 0),
    INDEX idx_bookings_user (user_id),
    INDEX idx_bookings_room_dates (room_id, check_in, check_out, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
