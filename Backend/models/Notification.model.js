const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'order_placed',       // buyer placed an order (farmer receives)
        'payment_received',   // buyer paid (farmer receives)
        'order_dispatched',   // farmer dispatched (buyer receives)
        'delivery_confirmed', // buyer confirmed receipt (farmer receives)
        'payment_released',   // payment released to farmer (farmer receives)
        'order_cancelled',    // order cancelled (both may receive)
        'payment_settings',   // reminder to set up payment details
        'system',             // generic system notification
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    icon:    { type: String, default: '🔔' },
    read:    { type: Boolean, default: false },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    metadata: { type: mongoose.Schema.Types.Mixed }, // any extra data
  },
  { timestamps: true }
);

// Auto-cleanup: delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
