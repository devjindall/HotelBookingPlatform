const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI Hotel Recommendation Assistant
router.post('/recommend', aiController.getRecommendations);

module.exports = router;
