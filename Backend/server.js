const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiter (global)
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/otp', require('./routes/otp.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/crops', require('./routes/crop.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── DB Connection & Start ────────────────────────────────────
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
});

// Track connected users: userId → socketId
const connectedUsers = new Map();
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('register', (userId) => {
    if (userId) { connectedUsers.set(userId, socket.id); console.log(`👤 User ${userId} registered`); }
  });
  socket.on('disconnect', () => {
    for (const [uid, sid] of connectedUsers) { if (sid === socket.id) { connectedUsers.delete(uid); break; } }
  });
});

// Helper to emit to a specific user
const emitToUser = (userId, event, data) => {
  const sid = connectedUsers.get(userId?.toString());
  if (sid) io.to(sid).emit(event, data);
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (Socket.IO enabled)`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
module.exports.io = io;
module.exports.emitToUser = emitToUser;