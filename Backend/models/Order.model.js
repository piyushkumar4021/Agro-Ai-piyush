const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop', required: true },
    quantity: { type: Number, required: true },
    pricePerUnit: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    /*
     * Status lifecycle:
     *  pending        → order placed, awaiting buyer payment
     *  payment_done   → buyer paid (escrow held); farmer can see buyer address & must dispatch
     *  dispatched     → farmer confirmed goods sent offline
     *  delivered      → buyer confirmed goods received → payment released to farmer
     *  cancelled      → cancelled before dispatch
     *  refunded       → refunded after dispute
     */
    status: {
      type: String,
      enum: ['pending', 'payment_done', 'dispatched', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },

    // Escrow flags
    farmerDispatched: { type: Boolean, default: false },
    buyerReceived: { type: Boolean, default: false },
    paymentReleased: { type: Boolean, default: false },

    // Delivery address (buyer's address sent to farmer after payment)
    deliveryAddress: {
      name: String,
      phone: String,
      street: String,
      village: String,
      district: String,
      state: String,
      pincode: String,
    },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'escrowed', 'released', 'refunded'],
      default: 'unpaid',
    },

    // Payment reference
    paymentRef:    { type: String },
    paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking'], default: 'upi' },

    // Razorpay references
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    notes: { type: String },
    cancelReason: { type: String },
    deliveredAt: { type: Date },
    dispatchedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ farmer: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
