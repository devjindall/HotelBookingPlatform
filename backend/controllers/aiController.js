const { pool } = require('../config/db');
const { extractHotelPreferences } = require('../services/aiService');

/**
 * AI Hotel Recommendation Assistant
 * POST /api/ai/recommend
 * Body: { prompt: "..." }
 */
async function getRecommendations(req, res, next) {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Please provide a travel description prompt in English or Japanese.', code: 'EMPTY_PROMPT' }
      });
    }

    // 1. Extract structured preferences (via Gemini LLM or robust fallback parser)
    const preferences = await extractHotelPreferences(prompt.trim());

    // 2. Build parameterized MySQL query using extracted preferences
    let whereClauses = ['1=1'];
    let havingClauses = ['1=1'];
    let queryParams = [];
    let havingParams = [];

    // Validated City filter
    if (preferences.city) {
      whereClauses.push('LOWER(h.city) = LOWER(?)');
      queryParams.push(preferences.city);
    }

    // Validated Rating filter
    if (preferences.minRating) {
      whereClauses.push('h.rating >= ?');
      queryParams.push(preferences.minRating);
    }

    // Validated Breakfast filter
    if (preferences.breakfast === true) {
      whereClauses.push('h.breakfast_available = TRUE');
    }

    // Validated Capacity filter
    if (preferences.guests) {
      whereClauses.push('r.capacity >= ?');
      queryParams.push(preferences.guests);
    }

    // Keyword Search in hotel metadata
    if (preferences.search) {
      const pattern = `%${preferences.search}%`;
      whereClauses.push('(h.name LIKE ? OR h.city LIKE ? OR h.address LIKE ? OR h.description LIKE ?)');
      queryParams.push(pattern, pattern, pattern, pattern);
    }

    // Validated Max Price filter
    if (preferences.maxPrice) {
      havingClauses.push('MIN(r.price_per_night) <= ?');
      havingParams.push(preferences.maxPrice);
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
      LIMIT 10
    `;

    const combinedParams = [...queryParams, ...havingParams];
    const [hotels] = await pool.query(sql, combinedParams);

    // If specific strict filter yields 0 matches, perform a relaxed fallback search on the city
    let results = hotels;
    if (results.length === 0 && preferences.city) {
      const fallbackSql = `
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
        WHERE LOWER(h.city) = LOWER(?)
        GROUP BY h.id, h.name, h.city, h.address, h.description, h.rating, h.breakfast_available, h.image_url
        ORDER BY h.rating DESC
        LIMIT 6
      `;
      const [fallbackHotels] = await pool.query(fallbackSql, [preferences.city]);
      results = fallbackHotels;
    }

    res.status(200).json({
      success: true,
      preferences,
      count: results.length,
      data: results.map(h => ({
        id: h.id,
        name: h.name,
        city: h.city,
        address: h.address,
        description: h.description,
        rating: Number(h.rating),
        breakfast_available: Boolean(h.breakfast_available),
        image_url: h.image_url,
        min_price: h.min_price !== null ? Number(h.min_price) : 0,
        max_capacity: Number(h.max_capacity || 0),
        room_types_count: Number(h.room_types_count || 0)
      }))
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRecommendations
};
