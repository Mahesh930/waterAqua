const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const responseHelper = require('./middleware/response.helper');
const errorHandler = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

// Connect to Database (Cloud Atlas or Local)
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: '*', // Adjust in production to match frontend host
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Custom response helper middleware
app.use(responseHelper);

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Join order room for status updates
  socket.on('joinOrder', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`Client ${socket.id} joined room order:${orderId}`);
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
  res.success({ status: 'UP', service: 'AquaHome MERN Backend' });
});

// Routes Scaffolding (will import in Phase 3)
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/suppliers', require('./routes/suppliers.routes'));
app.use('/api/v1/products', require('./routes/products.routes'));
app.use('/api/v1/cart', require('./routes/cart.routes'));
app.use('/api/v1/orders', require('./routes/orders.routes'));
app.use('/api/v1/notifications', require('./routes/notifications.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
