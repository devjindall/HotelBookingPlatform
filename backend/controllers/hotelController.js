const { pool } = require('../config/db');

/**
 * Get all hotels with optional filtering and search
 * GET /api/hotels
 * Query params: city, maxPrice, minRating, breakfast, guests, search
 */
async function getHotels(req, res, next) {
  try {
    const { city, maxPrice, minRating, breakfast, guests, search } = req.query;

    let whereClauses = ['1=1'];
    let havingClauses = ['1=1'];
    let queryParams = [];
    let havingParams = [];

    // Filter by City (exact match, case-insensitive)
    if (city && city.trim()) {
      whereClauses.push('LOWER(h.city) = LOWER(?)');
      queryParams.push(city.trim());
    }

    // Filter by Minimum Rating
    if (minRating !== undefined && minRating !== '') {
      const parsedRating = parseFloat(minRating);
      if (!isNaN(parsedRating)) {
        whereClauses.push('h.rating >= ?');
        queryParams.push(parsedRating);
      }
    }

    // Filter by Breakfast Availability
    if (breakfast !== undefined && breakfast !== '') {
      const isBreakfast = breakfast === 'true' || breakfast === '1' || breakfast === true;
      whereClauses.push('h.breakfast_available = ?');
      queryParams.push(isBreakfast ? 1 : 0);
    }

    // Filter by Guest Capacity (Hotel must have at least one room category accommodating this count)
    if (guests !== undefined && guests !== '') {
      const parsedGuests = parseInt(guests, 10);
      if (!isNaN(parsedGuests) && parsedGuests > 0) {
        whereClauses.push('r.capacity >= ?');
        queryParams.push(parsedGuests);
      }
    }

    // Keyword Search in Name, City, Address, or Description
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      whereClauses.push('(h.name LIKE ? OR h.city LIKE ? OR h.address LIKE ? OR h.description LIKE ?)');
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Filter by Maximum Price (via HAVING MIN(price_per_night) <= maxPrice)
    if (maxPrice !== undefined && maxPrice !== '') {
      const parsedMaxPrice = parseFloat(maxPrice);
      if (!isNaN(parsedMaxPrice) && parsedMaxPrice > 0) {
        havingClauses.push('MIN(r.price_per_night) <= ?');
        havingParams.push(parsedMaxPrice);
      }
    }

    const sql = `
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
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY h.id, h.name, h.city, h.address, h.description, h.rating, h.breakfast_available, h.image_url
      HAVING ${havingClauses.join(' AND ')}
      ORDER BY h.rating DESC, h.name ASC
    `;

    const combinedParams = [...queryParams, ...havingParams];
    const [hotels] = await pool.query(sql, combinedParams);

    // Format boolean fields and numbers cleanly
    const formattedHotels = hotels.map(h => ({
      ...h,
      breakfast_available: Boolean(h.breakfast_available),
      min_price: h.min_price !== null ? Number(h.min_price) : 0,
      rating: Number(h.rating),
      max_capacity: Number(h.max_capacity || 0),
      room_types_count: Number(h.room_types_count || 0)
    }));

    res.status(200).json({
      success: true,
      count: formattedHotels.length,
      data: formattedHotels
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single hotel details by ID
 * GET /api/hotels/:id
 */
async function getHotelById(req, res, next) {
  try {
    const hotelId = parseInt(req.params.id, 10);
    if (isNaN(hotelId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid hotel ID format.', code: 'INVALID_ID' }
      });
    }

    const [hotels] = await pool.query(
      'SELECT id, name, city, address, description, rating, breakfast_available, image_url, created_at FROM hotels WHERE id = ?',
      [hotelId]
    );

    if (hotels.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Hotel with ID ${hotelId} not found.`, code: 'HOTEL_NOT_FOUND' }
      });
    }

    const hotel = hotels[0];
    hotel.breakfast_available = Boolean(hotel.breakfast_available);
    hotel.rating = Number(hotel.rating);

    // Fetch room categories belonging to this hotel
    const [rooms] = await pool.query(
      'SELECT id, room_type, capacity, price_per_night, total_rooms, description FROM rooms WHERE hotel_id = ? ORDER BY price_per_night ASC',
      [hotelId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...hotel,
        rooms: rooms.map(r => ({
          ...r,
          price_per_night: Number(r.price_per_night),
          capacity: Number(r.capacity),
          total_rooms: Number(r.total_rooms)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get rooms for a hotel with dynamic availability checking
 * GET /api/hotels/:hotelId/rooms
 * Query params: checkIn, checkOut, guests
 */
async function getHotelRooms(req, res, next) {
  try {
    const hotelId = parseInt(req.params.hotelId, 10);
    if (isNaN(hotelId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid hotel ID format.', code: 'INVALID_ID' }
      });
    }

    const { checkIn, checkOut, guests } = req.query;

    // Verify hotel existence
    const [hotels] = await pool.query('SELECT id FROM hotels WHERE id = ?', [hotelId]);
    if (hotels.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Hotel with ID ${hotelId} not found.`, code: 'HOTEL_NOT_FOUND' }
      });
    }

    // Check if dates are provided for availability calculation
    const hasDates = Boolean(checkIn && checkOut);

    if (hasDates) {
      // Validate date order and validity
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);

      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid check-in or check-out date format (expected YYYY-MM-DD).', code: 'INVALID_DATE_FORMAT' }
        });
      }

      if (outDate <= inDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'Check-out date must be strictly after check-in date.', code: 'INVALID_DATE_RANGE' }
        });
      }
    }

    let sql = '';
    let params = [];

    if (hasDates) {
      // Calculate active overlapping confirmed bookings
      sql = `
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
            AND check_in < ?
            AND check_out > ?
          GROUP BY room_id
        ) b ON r.id = b.room_id
        WHERE r.hotel_id = ?
      `;
      params.push(checkOut, checkIn, hotelId);
    } else {
      sql = `
        SELECT 
          r.id,
          r.hotel_id,
          r.room_type,
          r.capacity,
          r.price_per_night,
          r.total_rooms,
          r.description,
          0 AS booked_count,
          r.total_rooms AS available_rooms,
          TRUE AS is_available
        FROM rooms r
        WHERE r.hotel_id = ?
      `;
      params.push(hotelId);
    }

    // Optional capacity filter
    if (guests !== undefined && guests !== '') {
      const parsedGuests = parseInt(guests, 10);
      if (!isNaN(parsedGuests) && parsedGuests > 0) {
        sql += ' AND r.capacity >= ?';
        params.push(parsedGuests);
      }
    }

    sql += ' ORDER BY r.price_per_night ASC';

    const [rooms] = await pool.query(sql, params);

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms.map(r => ({
        id: r.id,
        hotel_id: r.hotel_id,
        room_type: r.room_type,
        capacity: Number(r.capacity),
        price_per_night: Number(r.price_per_night),
        total_rooms: Number(r.total_rooms),
        booked_count: Number(r.booked_count),
        available_rooms: Math.max(0, Number(r.available_rooms)),
        is_available: Boolean(r.is_available && Number(r.available_rooms) > 0),
        description: r.description
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getHotels,
  getHotelById,
  getHotelRooms
};
