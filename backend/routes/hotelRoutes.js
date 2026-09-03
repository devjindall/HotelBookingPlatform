const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

// Hotel listing and search with multi-parameter filter
router.get('/', hotelController.getHotels);

// Single hotel details
router.get('/:id', hotelController.getHotelById);

// Rooms for a specific hotel (with availability check for checkIn/checkOut dates)
router.get('/:hotelId/rooms', hotelController.getHotelRooms);

module.exports = router;
