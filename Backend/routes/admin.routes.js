const express = require('express');
const router = express.Router();
const {
  getDashboard, getAllUsers, toggleUserStatus,
  approveCrop, getPendingCrops, getAllOrders, getMarketAnalytics,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All admin routes are protected
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/crops/pending', getPendingCrops);
router.put('/crops/:id/approve', approveCrop);
router.get('/orders', getAllOrders);
router.get('/analytics/market', getMarketAnalytics);

module.exports = router;
