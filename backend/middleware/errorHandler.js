function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND'
    }
  });
}

function errorHandler(err, req, res, next) {
  console.error(`[Error] [${req.method} ${req.originalUrl}]`, err.message);

  let statusCode = err.statusCode || 500;
  let message = statusCode >= 500 ? 'Internal Server Error' : (err.message || 'Request failed');
  let code = err.code || 'INTERNAL_ERROR';

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this information already exists.';
    code = 'DUPLICATE_ENTRY';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced resource does not exist.';
    code = 'FOREIGN_KEY_VIOLATION';
  }

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
