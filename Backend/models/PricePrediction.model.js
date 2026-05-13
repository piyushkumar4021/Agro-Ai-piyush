const mongoose = require('mongoose');

const pricePredictionSchema = new mongoose.Schema(
  {
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    cropName: { type: String, required: true },
    category: { type: String },
    inputFeatures: {
      season: String,
      district: String,
      state: String,
      qualityGrade: String,
      marketDemand: String,
    },
    predictedPrice: { type: Number, required: true },
    confidence: { type: Number },     // 0–100%
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modelVersion: { type: String, default: 'v1' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PricePrediction', pricePredictionSchema);
