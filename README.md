# Komorebi Stays — Hotel Booking Platform

A full-stack hotel booking application built with React, Node.js, Express, and MySQL.

## Features

- User registration and login with JWT authentication
- Hotel search and filtering
- Room availability checks for selected dates
- Booking and cancellation
- User booking history
- Natural-language hotel recommendations
- Automated integration tests

## Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8
- **Authentication:** JWT, bcrypt

## Project Structure

```text
HotelBookingPlatform/
├── frontend/    # React application
├── backend/     # Express API and business logic
├── database/    # MySQL schema and seed data
└── README.md
```

## Database Design

The application uses a relational model with `users`, `hotels`, `rooms`, and `bookings` tables. Foreign keys are used to maintain relationships between records.

Each room record represents a room type with a `total_rooms` value representing the number of available units. Availability is calculated from confirmed bookings that overlap the requested dates.

The booking flow uses a MySQL transaction and locks the selected room row with `FOR UPDATE` before checking availability and creating the booking. This prevents two concurrent booking requests from both reserving the same last available unit.

The date overlap check is:

```text
existing.check_in < requested.check_out
AND existing.check_out > requested.check_in
```

This also allows a new booking to start on the same day another booking ends.

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Get the logged-in user |
| GET | `/api/hotels` | Search and filter hotels |
| GET | `/api/hotels/:id` | Get hotel details |
| GET | `/api/hotels/:hotelId/rooms` | Check room availability |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings` | View booking history |
| GET | `/api/bookings/:id` | View a booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel a booking |
| POST | `/api/ai/recommend` | Convert natural-language preferences into search filters |

## Testing

The backend includes an integration test suite covering authentication, hotel search, room availability, booking, cancellation, ownership checks, and the recommendation feature.

Run it with:

```bash
cd backend
node test_integration.js
```

## Setup

### Prerequisites

- Node.js 18+
- MySQL 8+

### Database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The exact environment variables required by the backend are listed in `.env.example`.

## Demo Data

The repository includes synthetic hotel and booking data for local testing. The seed data is not scraped from commercial booking websites.

## License

MIT
