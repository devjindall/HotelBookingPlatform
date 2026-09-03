const { pool } = require('../config/db');

/**
 * Create a new booking using an atomic MySQL transaction
 * POST /api/bookings
 * Protected: req.user.id is used
 */
async function createBooking(req, res, next) {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const { roomId, checkIn, checkOut, guests } = req.body;

    // 1. Basic Payload Validation
    const parsedRoomId = parseInt(roomId, 10);
    const parsedGuests = parseInt(guests, 10);

    if (isNaN(parsedRoomId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid roomId is required.', code: 'INVALID_ROOM_ID' }
      });
    }

    if (isNaN(parsedGuests) || parsedGuests < 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Number of guests must be at least 1.', code: 'INVALID_GUESTS' }
      });
    }

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: { message: 'Both checkIn and checkOut dates are required.', code: 'MISSING_DATES' }
      });
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid date format (expected YYYY-MM-DD).', code: 'INVALID_DATE_FORMAT' }
      });
    }

    if (outDate <= inDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Check-out date must be strictly after check-in date.', code: 'INVALID_DATE_RANGE' }
      });
    }

    // Calculate number of nights
    const diffTime = outDate.getTime() - inDate.getTime();
    const nights = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Minimum booking duration is 1 night.', code: 'INVALID_DURATION' }
      });
    }

    // 2. BEGIN TRANSACTION with Row Lock
    await connection.beginTransaction();

    // Lock the room row to prevent race conditions during availability check
    const [rooms] = await connection.query(
      `SELECT r.id, r.hotel_id, r.room_type, r.capacity, r.price_per_night, r.total_rooms,
              h.name AS hotel_name, h.city AS hotel_city, h.image_url AS hotel_image
       FROM rooms r
       JOIN hotels h ON r.hotel_id = h.id
       WHERE r.id = ?
       FOR UPDATE`,
      [parsedRoomId]
    );

    if (rooms.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: { message: `Room with ID ${parsedRoomId} not found.`, code: 'ROOM_NOT_FOUND' }
      });
    }

    const room = rooms[0];

    // Validate guest capacity
    if (parsedGuests > room.capacity) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: {
          message: `This room accommodates a maximum of ${room.capacity} guest(s). Requested: ${parsedGuests}.`,
          code: 'EXCEEDS_CAPACITY'
        }
      });
    }

    // 3. Check availability for the requested date window
    const [overlapRows] = await connection.query(
      `SELECT COUNT(*) AS booked_count
       FROM bookings
       WHERE room_id = ?
         AND status = 'CONFIRMED'
         AND check_in < ?
         AND check_out > ?`,
      [parsedRoomId, checkOut, checkIn]
    );

    const bookedCount = overlapRows[0].booked_count;
    const availableUnits = room.total_rooms - bookedCount;

    if (availableUnits <= 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: {
          message: 'This room type is fully booked for the selected dates. Please choose different dates or room type.',
          code: 'ROOM_UNAVAILABLE'
        }
      });
    }

    // 4. Calculate total price strictly on the backend
    const pricePerNight = Number(room.price_per_night);
    const totalPrice = nights * pricePerNight;

    // 5. Insert booking record
    const [insertResult] = await connection.query(
      `INSERT INTO bookings (user_id, room_id, check_in, check_out, guests, total_price, status)
       VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [userId, parsedRoomId, checkIn, checkOut, parsedGuests, totalPrice]
    );

    const bookingId = insertResult.insertId;

    // 6. COMMIT TRANSACTION
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Booking successfully confirmed',
      data: {
        id: bookingId,
        user_id: userId,
        room_id: parsedRoomId,
        hotel_name: room.hotel_name,
        hotel_city: room.hotel_city,
        hotel_image: room.hotel_image,
        room_type: room.room_type,
        check_in: checkIn,
        check_out: checkOut,
        nights,
        guests: parsedGuests,
        price_per_night: pricePerNight,
        total_price: totalPrice,
        status: 'CONFIRMED'
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * Get all bookings belonging to the authenticated user
 * GET /api/bookings
 * Protected
 */
async function getMyBookings(req, res, next) {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        b.id,
        b.room_id,
        b.check_in,
        b.check_out,
        b.guests,
        b.total_price,
        b.status,
        b.created_at,
        r.room_type,
        r.price_per_night,
        r.capacity,
        h.id AS hotel_id,
        h.name AS hotel_name,
        h.city AS hotel_city,
        h.address AS hotel_address,
        h.image_url AS hotel_image,
        DATEDIFF(b.check_out, b.check_in) AS nights
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `;

    const [bookings] = await pool.query(sql, [userId]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings.map(b => ({
        id: b.id,
        room_id: b.room_id,
        hotel_id: b.hotel_id,
        hotel_name: b.hotel_name,
        hotel_city: b.hotel_city,
        hotel_address: b.hotel_address,
        hotel_image: b.hotel_image,
        room_type: b.room_type,
        capacity: Number(b.capacity),
        check_in: b.check_in.toISOString ? b.check_in.toISOString().split('T')[0] : String(b.check_in),
        check_out: b.check_out.toISOString ? b.check_out.toISOString().split('T')[0] : String(b.check_out),
        nights: Number(b.nights),
        guests: Number(b.guests),
        price_per_night: Number(b.price_per_night),
        total_price: Number(b.total_price),
        status: b.status,
        created_at: b.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single booking by ID (ownership verified)
 * GET /api/bookings/:id
 * Protected
 */
async function getBookingById(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid booking ID format.', code: 'INVALID_ID' }
      });
    }

    const sql = `
      SELECT 
        b.id,
        b.user_id,
        b.room_id,
        b.check_in,
        b.check_out,
        b.guests,
        b.total_price,
        b.status,
        b.created_at,
        r.room_type,
        r.price_per_night,
        r.capacity,
        h.id AS hotel_id,
        h.name AS hotel_name,
        h.city AS hotel_city,
        h.address AS hotel_address,
        h.image_url AS hotel_image,
        DATEDIFF(b.check_out, b.check_in) AS nights
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN hotels h ON r.hotel_id = h.id
      WHERE b.id = ?
    `;

    const [bookings] = await pool.query(sql, [bookingId]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Booking with ID ${bookingId} not found.`, code: 'BOOKING_NOT_FOUND' }
      });
    }

    const booking = bookings[0];

    // Authorization: Verify booking ownership
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. You do not have permission to view this booking.', code: 'FORBIDDEN_ACCESS' }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: booking.id,
        room_id: booking.room_id,
        hotel_id: booking.hotel_id,
        hotel_name: booking.hotel_name,
        hotel_city: booking.hotel_city,
        hotel_address: booking.hotel_address,
        hotel_image: booking.hotel_image,
        room_type: booking.room_type,
        capacity: Number(booking.capacity),
        check_in: booking.check_in.toISOString ? booking.check_in.toISOString().split('T')[0] : String(booking.check_in),
        check_out: booking.check_out.toISOString ? booking.check_out.toISOString().split('T')[0] : String(booking.check_out),
        nights: Number(booking.nights),
        guests: Number(booking.guests),
        price_per_night: Number(booking.price_per_night),
        total_price: Number(booking.total_price),
        status: booking.status,
        created_at: booking.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel own booking
 * PATCH /api/bookings/:id/cancel
 * Protected
 */
async function cancelBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid booking ID format.', code: 'INVALID_ID' }
      });
    }

    // 1. Fetch booking to verify existence and ownership
    const [bookings] = await pool.query('SELECT id, user_id, status FROM bookings WHERE id = ?', [bookingId]);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Booking with ID ${bookingId} not found.`, code: 'BOOKING_NOT_FOUND' }
      });
    }

    const booking = bookings[0];

    // 2. Authorization check
    if (booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. You can only cancel your own bookings.', code: 'FORBIDDEN_CANCELLATION' }
      });
    }

    // 3. Status check
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: { message: 'This booking has already been cancelled.', code: 'ALREADY_CANCELLED' }
      });
    }

    // 4. Update status to CANCELLED
    await pool.query("UPDATE bookings SET status = 'CANCELLED' WHERE id = ?", [bookingId]);

    res.status(200).json({
      success: true,
      message: 'Booking successfully cancelled. The room inventory has been released.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking
};
