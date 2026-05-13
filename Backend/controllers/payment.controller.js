const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order       = require('../models/Order.model');
const Transaction = require('../models/Transaction.model');
const { createNotification } = require('./notification.controller');

// ─── Razorpay instance ────────────────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Helper ───────────────────────────────────────────────────────────────────
const genRef = () =>
  'AGRO' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

// ─── POST /api/payments/:orderId/create-order ─────────────────────────────────
// Creates a Razorpay Order (buyer calls this before opening Razorpay checkout)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('crop', 'name');
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your order' });

    if (order.status !== 'pending')
      return res.status(400).json({ success: false, message: `Cannot pay for order with status: ${order.status}` });

    const { paymentMethod = 'upi' } = req.body;

    // Create Razorpay order — amount in paise (INR × 100)
    const rzpOrder = await razorpay.orders.create({
      amount:   Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt:  `order_${order._id.toString().slice(-10)}`,
      notes: {
        orderId:       order._id.toString(),
        buyerId:       order.buyer.toString(),
        farmerId:      order.farmer.toString(),
        cropName:      order.crop?.name || 'Crop',
        paymentMethod: paymentMethod,
      },
    });

    // Save Razorpay order reference
    order.razorpayOrderId = rzpOrder.id;
    order.paymentMethod   = paymentMethod;
    await order.save({ validateBeforeSave: false });

    res.json({
      success: true,
      razorpayOrder: {
        id:       rzpOrder.id,
        amount:   rzpOrder.amount,
        currency: rzpOrder.currency,
      },
      keyId:    process.env.RAZORPAY_KEY_ID,
      order: {
        _id:         order._id,
        totalAmount: order.totalAmount,
        cropName:    order.crop?.name || 'Crop',
        quantity:    order.quantity,
      },
    });
  } catch (err) {
    console.error('Razorpay create order error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/payments/:orderId/verify ───────────────────────────────────────
// Verifies Razorpay payment signature and marks order as paid
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification data' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed — invalid signature' });
    }

    // Signature is valid — update order
    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your order' });

    // Prevent double-processing
    if (order.status !== 'pending') {
      return res.json({
        success: true,
        message: 'Order already processed',
        order,
        paymentRef: order.paymentRef,
      });
    }

    const ref = genRef();

    order.status              = 'payment_done';
    order.paymentStatus       = 'escrowed';
    order.paymentRef          = ref;
    order.paidAt              = new Date();
    order.razorpayPaymentId   = razorpay_payment_id;
    order.razorpaySignature   = razorpay_signature;
    await order.save();

    // Create transaction record
    await Transaction.create({
      order:                order._id,
      buyer:                order.buyer,
      farmer:               order.farmer,
      amount:               order.totalAmount,
      type:                 'payment',
      status:               'success',
      paymentMethod:        order.paymentMethod || 'upi',
      transactionRef:       ref,
      razorpayPaymentId:    razorpay_payment_id,
      note:                 'Payment held in escrow — will be released to farmer after delivery confirmation',
    });

    await order.populate(['buyer', 'farmer', 'crop']);

    console.log(`✅ Payment verified: Order ${order._id} — ₹${order.totalAmount} (${ref})`);

    // NOTE: Farmer does NOT get a payment notification here.
    // They already received "New Order Received" when the order was placed.
    // They will get "Payment Released" only after buyer confirms delivery.

    // Notify buyer: payment success (held in escrow by AgroAI)
    createNotification({
      userId: order.buyer._id || order.buyer,
      type: 'payment_escrowed',
      title: 'Payment Secured! ✅',
      message: `Your payment of ₹${order.totalAmount.toLocaleString('en-IN')} is securely held by AgroAI. It will only be released to the farmer after you confirm receipt of goods.`,
      icon: '✅',
      orderId: order._id,
    });
    res.json({
      success:    true,
      message:    'Payment verified successfully! Farmer has been notified.',
      order,
      paymentRef: ref,
    });
  } catch (err) {
    console.error('Payment verification error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/payments/:orderId/status ────────────────────────────────────────
exports.getPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' });

    const isParty =
      order.buyer.toString()  === req.user._id.toString() ||
      order.farmer.toString() === req.user._id.toString() ||
      req.user.role === 'admin';
    if (!isParty)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    res.json({
      success:       true,
      status:        order.status,
      paymentStatus: order.paymentStatus,
      paymentRef:    order.paymentRef,
      paymentMethod: order.paymentMethod,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Payment release (called on delivery confirmation) ────────────────────────
exports.releasePayment = async (order) => {
  try {
    console.log(`💰 Payment released for order ${order._id}: ₹${order.totalAmount} to farmer ${order.farmer}`);

    await Transaction.findOneAndUpdate(
      { order: order._id, type: 'payment' },
      {
        status: 'success',
        note:   'Payment released to farmer after delivery confirmation',
      }
    );

    return true;
  } catch (err) {
    console.error('Payment release error:', err.message);
    return false;
  }
};
