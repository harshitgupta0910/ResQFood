const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const listingRoutes = require('./routes/listing.routes');
const claimRoutes = require('./routes/claim.routes');
const pickupRoutes = require('./routes/pickup.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const adminRoutes = require('./routes/admin.routes');
const utilsRoutes = require('./routes/utils.routes');
const ratingRoutes = require('./routes/rating.routes');
const complaintRoutes = require('./routes/complaint.routes');

// Middleware imports
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security & parsing middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://res-q-food-00.vercel.app',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ResQFood API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/complaints', complaintRoutes);

// Notification routes (inline for simplicity)
const { protect } = require('./middleware/auth.middleware');
const { getUserNotifications, markAsRead, markAllAsRead } = require('./services/notification.service');

app.get('/api/notifications', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const result = await getUserNotifications(req.user._id, {
      page: Number(page),
      limit: Number(limit),
      unreadOnly: unreadOnly === 'true',
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/notifications/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await markAsRead(req.params.id, req.user._id);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/notifications/read-all', protect, async (req, res, next) => {
  try {
    await markAllAsRead(req.user._id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

module.exports = app;
