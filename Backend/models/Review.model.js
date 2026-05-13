const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    type: { type: String, enum: ['farmer_review', 'buyer_review', 'crop_review'] },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewedUser: 1 });
reviewSchema.index({ crop: 1 });

module.exports = mongoose.model('Review', reviewSchema);
