const User = require('../models/User.model');
const Crop = require('../models/Crop.model');
const Order = require('../models/Order.model');
const Transaction = require('../models/Transaction.model');
const PricePrediction = require('../models/PricePrediction.model');

// @route GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalCrops, totalOrders, totalTransactions] = await Promise.all([
      User.countDocuments(),
      Crop.countDocuments(),
      Order.countDocuments(),
      Transaction.countDocuments({ status: 'success' }),
    ]);

    const revenueAgg = await Transaction.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const pendingApprovals = await Crop.countDocuments({ isApproved: false });
    const activeUsers = await User.countDocuments({ isActive: true });

    // Monthly orders trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const orderTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalCrops,
        pendingApprovals,
        totalOrders,
        totalTransactions,
        totalRevenue: revenueAgg[0]?.total || 0,
        orderTrend,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, total, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/admin/users/:id/toggle
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/admin/crops/:id/approve
exports.approveCrop = async (req, res) => {
  try {
    const crop = await Crop.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
    res.json({ success: true, message: 'Crop approved', crop });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/crops/pending
exports.getPendingCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ isApproved: false })
      .populate('farmer', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, crops });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/orders
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const orders = await Order.find(query)
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .populate('crop', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(query);
    res.json({ success: true, total, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/admin/analytics/market
exports.getMarketAnalytics = async (req, res) => {
  try {
    const topCrops = await Order.aggregate([
      { $group: { _id: '$crop', totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'crops', localField: '_id', foreignField: '_id', as: 'crop' } },
      { $unwind: '$crop' },
    ]);

    const categoryDemand = await Crop.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const aiUsage = await PricePrediction.countDocuments();

    res.json({ success: true, topCrops, categoryDemand, aiPredictionsTotal: aiUsage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
