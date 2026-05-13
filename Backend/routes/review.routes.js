const express = require('express');
const router = express.Router();
const { createReview, getUserReviews, getCropReviews } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.get('/crop/:cropId', getCropReviews);

module.exports = router;
