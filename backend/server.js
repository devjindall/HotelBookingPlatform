const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool, testConnection } = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS db_check');
    res.status(200).json({
      success: true,
      message: 'Hotel Booking API is healthy and operational',
      timestamp: new Date().toISOString(),
      database: result[0].db_check === 2 ? 'Connected' : 'Error',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service degraded: Database unreachable',
      error: error.message
    });
  }
});

// Future Phase Route Mounts will be attached here
// app.use('/api/auth', authRoutes);
// app.use('/api/hotels', hotelRoutes);
// app.use('/api/bookings', bookingRoutes);
// app.use('/api/ai', aiRoutes);

// Fallback 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🚀 Hotel Booking Platform Server running on port ${PORT}`);
    console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
    await testConnection();
  });
}

module.exports = app;
