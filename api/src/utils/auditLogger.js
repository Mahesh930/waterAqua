const AuditLog = require('../models/AuditLog');

const logAudit = async ({ userId, action, entityType, entityId, details = {}, req = null }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    await AuditLog.create({
      user: userId || (req && req.user ? req.user.id : null),
      action,
      entityType,
      entityId,
      details,
      ipAddress
    });
  } catch (error) {
    const logger = require('./logger');
    logger.error({ error }, 'Failed to write audit log');
  }
};

module.exports = { logAudit };
