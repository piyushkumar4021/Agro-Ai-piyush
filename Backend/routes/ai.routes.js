const express = require('express');
const router = express.Router();
const { predictPrice, getCropRecommendations, getPriceHistory, getModelStats } = require('../controllers/ai.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/predict-price', protect, authorize('farmer'), predictPrice);
router.get('/recommendations', protect, authorize('buyer'), getCropRecommendations);
router.get('/price-history', protect, getPriceHistory);
router.get('/model-stats', protect, authorize('admin'), getModelStats);

module.exports = router;
