const Review = require('../models/Review.model');
const Order = require('../models/Order.model');

// @route POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, type, reviewedUserId, cropId } = req.body;

    const order = await Order.findById(orderId);
    if (!order || order.status !== 'delivered')
      return res.status(400).json({ success: false, message: 'Can only review delivered orders' });

    const existing = await Review.findOne({ order: orderId, reviewer: req.user._id, type });
    if (existing)
      return res.status(400).json({ success: false, message: 'Review already submitted' });

    const review = await Review.create({
      order: orderId,
      reviewer: req.user._id,
      reviewedUser: reviewedUserId,
      crop: cropId,
      rating,
      comment,
      type,
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/reviews/user/:userId
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUser: req.params.userId })
      .populate('reviewer', 'name profileImage')
      .sort({ createdAt: -1 });

    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
    res.json({ success: true, reviews, avgRating: avgRating.toFixed(1) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/reviews/crop/:cropId
exports.getCropReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ crop: req.params.cropId, type: 'crop_review' })
      .populate('reviewer', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
