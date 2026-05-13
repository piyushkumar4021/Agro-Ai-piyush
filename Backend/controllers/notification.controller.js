const Notification = require('../models/Notification.model');

// ─── Helper: create a notification ──────────────────────────────────────────
exports.createNotification = async ({ userId, type, title, message, icon, orderId, metadata }) => {
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      message,
      icon: icon || '🔔',
      orderId,
      metadata,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// ─── GET /api/notifications ──────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const { limit = 30, unreadOnly } = req.query;
    const filter = { user: req.user._id };
    if (unreadOnly === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/notifications/read-all ─────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
