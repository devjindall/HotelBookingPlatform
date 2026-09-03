/**
 * 404 Not Found Middleware for unmatched routes
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND'
    }
  });
}

/**
 * Centralized Global Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error(`[Error] [${req.method} ${req.originalUrl}]`, err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle MySQL Duplicate Entry (e.g. unique email constraint)
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this information already exists (e.g., email already registered).';
    code = 'DUPLICATE_ENTRY';
  }

  // Handle MySQL Foreign Key constraint violations
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced resource does not exist (invalid hotel ID, room ID, or user ID).';
    code = 'FOREIGN_KEY_VIOLATION';
  }

  // Handle JWT verification errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication session has expired. Please log in again.';
    code = 'TOKEN_EXPIRED';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
