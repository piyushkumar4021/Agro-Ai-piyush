const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction.model');
const { protect, authorize } = require('../middleware/auth.middleware');

// GET /api/transactions/my
router.get('/my', protect, async (req, res) => {
  try {
    const query = req.user.role === 'buyer'
      ? { buyer: req.user._id }
      : { farmer: req.user._id };

    const transactions = await Transaction.find(query)
      .populate('order', 'status totalAmount')
      .sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions  — admin only
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const transactions = await Transaction.find(query)
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .populate('order')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Transaction.countDocuments(query);
    res.json({ success: true, total, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
