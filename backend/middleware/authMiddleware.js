const jwt = require('jsonwebtoken');

/**
 * Check the JWT from the Authorization header and attach the
 * decoded user information to the request.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access denied. No authorization token provided.',
        code: 'AUTH_TOKEN_MISSING'
      }
    });
  }

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
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Server authentication is not configured.',
        code: 'AUTH_CONFIG_ERROR'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
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
