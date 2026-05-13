const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['payment', 'refund'], default: 'payment' },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'card'], default: 'cash' },
    transactionRef: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String },
    note: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
