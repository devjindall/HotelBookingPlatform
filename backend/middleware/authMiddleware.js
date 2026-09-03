const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Validates incoming Bearer token in the Authorization header
 * and attaches verified user payload to `req.user`.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access denied. No authorization token provided.',
        code: 'AUTH_TOKEN_MISSING'
      }
    });
  }

  // Token format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Malformed authorization header. Expected "Bearer <token>".',
        code: 'AUTH_TOKEN_MALFORMED'
      }
    });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || 'hotel_booking_jwt_super_secret_key_2026_placement_ready';

  try {
    const decoded = jwt.verify(token, secret);
    // Attach user payload (id, email, name)
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authorization token has expired. Please log in again.',
          code: 'AUTH_TOKEN_EXPIRED'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid authorization token.',
        code: 'AUTH_TOKEN_INVALID'
      }
    });
  }
}

module.exports = {
  authenticateToken
};
