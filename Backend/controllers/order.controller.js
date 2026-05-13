const Order = require('../models/Order.model');
const Crop = require('../models/Crop.model');
const Transaction = require('../models/Transaction.model');
const { releasePayment } = require('./payment.controller');
const { createNotification } = require('./notification.controller');
const emailService = require('../services/email.service');
const { emitToUser } = require('../server');

// ─── Helper ───────────────────────────────────────────────────────────────────
const genRef = () => 'AGRO' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();

// ─── POST /api/orders  ← buyer places order ──────────────────────────────────
exports.placeOrder = async (req, res) => {
  try {
    const { cropId, quantity, deliveryAddress, notes } = req.body;

    const crop = await Crop.findById(cropId);
    if (!crop || crop.status !== 'available')
      return res.status(400).json({ success: false, message: 'Crop not available' });

    if (quantity > crop.quantity)
      return res.status(400).json({ success: false, message: 'Requested quantity exceeds stock' });

    const totalAmount = quantity * crop.pricePerUnit;

    const order = await Order.create({
      buyer: req.user._id,
      farmer: crop.farmer,
      crop: cropId,
      quantity,
      pricePerUnit: crop.pricePerUnit,
      totalAmount,
      deliveryAddress,
      notes,
      status: 'pending',
      paymentStatus: 'unpaid',
    });

    // Reserve stock
    crop.quantity -= quantity;
    if (crop.quantity === 0) crop.status = 'sold';
    await crop.save({ validateBeforeSave: false });

    await order.populate(['buyer', 'farmer', 'crop']);

    // Notify farmer about new order
    createNotification({
      userId: order.farmer._id || order.farmer,
      type: 'order_placed',
      title: 'New Order Received!',
      message: `${req.user.name} ordered ${quantity} Qtl of ${crop.name} for ₹${totalAmount.toLocaleString('en-IN')}`,
      icon: '🛒',
      orderId: order._id,
    });

    // Email farmer
    if (order.farmer?.email) emailService.sendOrderPlacedToFarmer(order.farmer.email, order);

    // Real-time Socket.IO
    try { emitToUser(order.farmer._id || order.farmer, 'notification', { type: 'order_placed', title: '🛒 New Order!', message: `${req.user.name} ordered ${quantity} Qtl of ${crop.name}`, orderId: order._id }); } catch {}

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/orders/:id/pay  ← buyer makes demo payment ────────────────────
exports.payForOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your order' });

    if (order.status !== 'pending')
      return res.status(400).json({ success: false, message: `Cannot pay for order with status: ${order.status}` });

    const { paymentMethod = 'upi' } = req.body;
    const ref = genRef();

    order.status = 'payment_done';
    order.paymentStatus = 'escrowed';
    order.paymentMethod = paymentMethod;
    order.paymentRef = ref;
    order.paidAt = new Date();
    await order.save();

    // Create successful transaction (escrow)
    await Transaction.create({
      order: order._id,
      buyer: req.user._id,
      farmer: order.farmer,
      amount: order.totalAmount,
      type: 'payment',
      status: 'success',
      paymentMethod,
      transactionRef: ref,
      note: 'Payment held in escrow — will be released to farmer after delivery confirmation',
    });

    await order.populate(['buyer', 'farmer', 'crop']);
    res.json({ success: true, order, paymentRef: ref, message: 'Payment successful! Farmer has been notified with your delivery address.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/orders/:id/dispatch  ← farmer confirms goods sent ───────────────
exports.confirmDispatch = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.farmer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your order' });

    if (order.status !== 'payment_done')
      return res.status(400).json({ success: false, message: 'Order must be in payment_done state to dispatch' });

    order.status = 'dispatched';
    order.farmerDispatched = true;
    order.dispatchedAt = new Date();
    await order.save();

    await order.populate(['buyer', 'farmer', 'crop']);

    // Notify buyer about dispatch
    createNotification({
      userId: order.buyer._id || order.buyer,
      type: 'order_dispatched',
      title: 'Order Dispatched! 🚛',
      message: `Your order for ${order.crop?.name || 'crop'} has been dispatched by ${order.farmer?.name || 'the farmer'}. Confirm receipt when you get it.`,
      icon: '🚛',
      orderId: order._id,
    });

    // Email buyer
    if (order.buyer?.email) emailService.sendDispatchedToBuyer(order.buyer.email, order);

    // Real-time Socket.IO
    try { emitToUser(order.buyer._id || order.buyer, 'notification', { type: 'order_dispatched', title: '🚛 Order Dispatched!', message: `Your ${order.crop?.name} order is on the way!`, orderId: order._id }); } catch {}

    res.json({ success: true, order, message: 'Dispatch confirmed! Buyer has been notified to confirm receipt.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/orders/:id/confirm-receipt  ← buyer confirms received ───────────
exports.confirmReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not your order' });

    if (order.status !== 'dispatched')
      return res.status(400).json({ success: false, message: 'Order must be dispatched before confirming receipt' });

    order.status = 'delivered';
    order.buyerReceived = true;
    order.paymentReleased = true;
    order.paymentStatus = 'released';
    order.deliveredAt = new Date();
    await order.save();

    // Mark transaction as released
    await Transaction.findOneAndUpdate(
      { order: order._id, type: 'payment' },
      { status: 'success', note: 'Payment released to farmer after delivery confirmation' }
    );

    // Trigger payment release (Razorpay payout tracking)
    await releasePayment(order);

    await order.populate(['buyer', 'farmer', 'crop']);

    // Notify farmer: payment released by AgroAI mediator
    createNotification({
      userId: order.farmer._id || order.farmer,
      type: 'payment_released',
      title: 'Payment Released to You! 💰',
      message: `AgroAI has released ₹${order.totalAmount.toLocaleString('en-IN')} to your account for ${order.crop?.name || 'crop'}. The buyer confirmed receipt of goods. Check your payment settings for payout details.`,
      icon: '💰',
      orderId: order._id,
    });

    // Notify buyer: delivery confirmed, mediator released payment
    createNotification({
      userId: order.buyer._id || order.buyer,
      type: 'delivery_confirmed',
      title: 'Delivery Confirmed ✅',
      message: `Your ${order.crop?.name || 'crop'} order has been delivered successfully. AgroAI has released ₹${order.totalAmount.toLocaleString('en-IN')} from escrow to the farmer.`,
      icon: '✅',
      orderId: order._id,
    });

    // Email both parties
    if (order.farmer?.email) emailService.sendPaymentReleasedToFarmer(order.farmer.email, order);
    if (order.buyer?.email) emailService.sendDeliveryConfirmedToBuyer(order.buyer.email, order);

    // Real-time Socket.IO
    try {
      emitToUser(order.farmer._id || order.farmer, 'notification', { type: 'payment_released', title: '💰 Payment Released!', message: `₹${order.totalAmount.toLocaleString('en-IN')} released for ${order.crop?.name}`, orderId: order._id });
      emitToUser(order.buyer._id || order.buyer, 'notification', { type: 'delivery_confirmed', title: '✅ Delivery Confirmed!', message: `Your ${order.crop?.name} order is complete.`, orderId: order._id });
    } catch {}

    res.json({ success: true, order, message: 'Receipt confirmed! Payment has been released to the farmer.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/orders/my  ← buyer ──────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('crop', 'name images category')
      .populate('farmer', 'name phone address')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/orders/farmer  ← farmer ─────────────────────────────────────────
exports.getFarmerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user._id })
      .populate('crop', 'name images')
      .populate('buyer', 'name phone email address paymentDetails')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('crop')
      .populate('buyer', 'name email phone address')
      .populate('farmer', 'name email phone address');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isParty =
      order.buyer._id.toString() === req.user._id.toString() ||
      order.farmer._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';
    if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized' });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/orders/:id/status  ← admin ─────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'released';
      order.paymentReleased = true;
      await Transaction.findOneAndUpdate({ order: order._id }, { status: 'success' });
    }
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/orders/:id/cancel  ← buyer (only before payment) ───────────────
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.buyer.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    if (!['pending'].includes(order.status))
      return res.status(400).json({ success: false, message: 'Can only cancel unpaid orders. Contact support for paid orders.' });

    order.status = 'cancelled';
    order.cancelReason = req.body.reason;
    await order.save();

    // Restore crop quantity
    await Crop.findByIdAndUpdate(order.crop, {
      $inc: { quantity: order.quantity },
      status: 'available',
    });

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
