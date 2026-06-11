const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const responseHelper = require('./middleware/response.helper');
const errorHandler = require('./middleware/error.middleware');
const mongoose = require('mongoose');

const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Validate environment variables
if (process.env.NODE_ENV !== 'test') {
  const validateEnv = require('./config/validateEnv');
  validateEnv();
}

// Connect to Database (Cloud Atlas or Local)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();
const server = http.createServer(app);

// CORS configuration options
const allowedOrigins = ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or tool execution)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
};

// Initialize Socket.io
const io = socketIo(server, {
  cors: corsOptions
});

const correlationId = require('./middleware/correlation.middleware');
const logger = require('./utils/logger');

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(correlationId);
app.use((req, res, next) => {
  req.logger = logger.child({ correlationId: req.correlationId });
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Custom response helper middleware
app.use(responseHelper);

// Rate Limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many login attempts from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Too many OTP verification attempts from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/orders/:id/verify-otp', otpLimiter);

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Join order room for status updates
  socket.on('joinOrder', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`Client ${socket.id} joined room order:${orderId}`);
  });

  // Join supplier room for incoming order alerts
  socket.on('joinSupplier', (supplierId) => {
    socket.join(`supplier:${supplierId}`);
    console.log(`Client ${socket.id} joined supplier room supplier:${supplierId}`);
  });

  // Handle driver real-time geolocation stream from supplier
  socket.on('driverLocationUpdate', ({ orderId, latitude, longitude }) => {
    // Broadcast coordinates instantly to all listeners in the order room
    io.to(`order:${orderId}`).emit('driverLocationChanged', { orderId, latitude, longitude });
  });

  // Leave order room
  socket.on('leaveOrder', (orderId) => {
    socket.leave(`order:${orderId}`);
    console.log(`Client ${socket.id} left room order:${orderId}`);
  });

  // Leave supplier room
  socket.on('leaveSupplier', (supplierId) => {
    socket.leave(`supplier:${supplierId}`);
    console.log(`Client ${socket.id} left supplier room supplier:${supplierId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Attach socket server to Express app request context so we can emit events in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbConnected = dbState === 1;

  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      error: 'Database connection is DOWN',
      dbState,
      timestamp: new Date().toISOString()
    });
  }

  res.success({
    status: 'UP',
    database: 'UP',
    uptime: process.uptime(),
    service: 'AquaHome MERN Backend'
  });
});

// Routes Scaffolding (will import in Phase 3)
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/suppliers', require('./routes/suppliers.routes'));
app.use('/api/v1/products', require('./routes/products.routes'));
app.use('/api/v1/cart', require('./routes/cart.routes'));
app.use('/api/v1/orders', require('./routes/orders.routes'));
app.use('/api/v1/notifications', require('./routes/notifications.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/referrals', require('./routes/referral.routes'));

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = { app, server };
