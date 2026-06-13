const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    const log = req.logger || require('../utils/logger');
    log.warn({ route: `${req.method} ${req.originalUrl}` }, '[AUTH] Rejected — no token provided');
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Token is missing.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      const log = req.logger || require('../utils/logger');
      log.warn({ decodedId: decoded.id }, '[AUTH] Rejected — user no longer exists or was deleted');
      return res.status(401).json({
        success: false,
        error: 'The user belonging to this token no longer exists.',
        timestamp: new Date().toISOString()
      });
    }

    // Validate JWT role matches current DB role (detect stale/tampered tokens)
    if (decoded.role && decoded.role !== user.role) {
      const log = req.logger || require('../utils/logger');
      log.warn({ userId: user._id, tokenRole: decoded.role, dbRole: user.role }, '[AUTH] Rejected — token role mismatch (stale token)');
      return res.status(401).json({
        success: false,
        error: 'Your session is outdated. Please log in again.',
        timestamp: new Date().toISOString()
      });
    }

    if (user.status === 'suspended') {
      const log = req.logger || require('../utils/logger');
      log.warn({ userId: user._id, email: user.email }, '[AUTH] Rejected — account suspended');
      return res.status(403).json({
        success: false,
        error: 'Your account is suspended. Contact admin support.',
        timestamp: new Date().toISOString()
      });
    }

    // Grant access to route
    req.user = user;
    next();
  } catch (error) {
    const log = req.logger || require('../utils/logger');
    log.warn({ err: error.message }, '[AUTH] Rejected — invalid or expired token');
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Invalid or expired token.',
      timestamp: new Date().toISOString()
    });
  }
};

// Restrict routes to specific user roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this action`,
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
