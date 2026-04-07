require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initializeSocket } = require('./sockets/index');
const { startExpiryJob } = require('./jobs/expiry.job');
const { startClaimVerificationJob } = require('./jobs/claimVerification.job');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://res-q-food-00.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes
app.set('io', io);

// Initialize socket handlers
initializeSocket(io);

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info(`🚀 ResQFood server running on port ${PORT}`);
      logger.info(`📡 Socket.IO ready`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start background jobs
    startExpiryJob(io, 60000); // Check every minute
    startClaimVerificationJob(io, 5000); // Verification checks every 5s

  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

// Trigger restart
