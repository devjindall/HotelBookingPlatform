const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All booking routes require JWT authentication
router.use(authenticateToken);

// Create new booking (transactional)
router.post('/', bookingController.createBooking);

// Get user's booking history
router.get('/', bookingController.getMyBookings);

// Get single booking details (ownership checked)
router.get('/:id', bookingController.getBookingById);

// Cancel booking (ownership checked)
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
