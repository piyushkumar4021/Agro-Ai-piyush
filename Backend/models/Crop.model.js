const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['vegetables', 'fruits', 'grains', 'pulses', 'spices', 'others'],
      required: true,
    },
    description: { type: String },
    quantity: { type: Number, required: true },      // in kg
    unit: { type: String, default: 'kg' },
    pricePerUnit: { type: Number, required: true },  // manual price set by farmer
    aiSuggestedPrice: { type: Number },              // from AI module
    images: [{ type: String }],
    harvestDate: { type: Date },
    availableUntil: { type: Date },
    location: {
      village: String,
      district: String,
      state: String,
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved', 'expired'],
      default: 'available',
    },
    isApproved: { type: Boolean, default: false },  // Admin approves listings
    views: { type: Number, default: 0 },
    qualityGrade: { type: String, enum: ['A', 'B', 'C'], default: 'B' },
  },
  { timestamps: true }
);

cropSchema.index({ name: 'text', description: 'text' });
cropSchema.index({ category: 1, status: 1 });
cropSchema.index({ farmer: 1 });

module.exports = mongoose.model('Crop', cropSchema);
