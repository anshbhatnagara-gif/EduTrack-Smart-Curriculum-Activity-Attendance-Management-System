const { query } = require('../config/database');

/**
 * Utility function to create an entry in the audit_logs table
 */
const logAuditAction = async ({
  userId,
  action,
  entityType,
  entityId = 0,
  oldValues = null,
  newValues = null,
  req = null
}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || null) : null;
    const userAgent = req ? (req.headers['user-agent'] || null) : null;

    const oldJson = oldValues ? JSON.stringify(oldValues) : null;
    const newJson = newValues ? JSON.stringify(newValues) : null;

    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, action, entityType, entityId, oldJson, newJson, ipAddress, userAgent]
    );
  } catch (err) {
    // Fail silently in production or log error to prevent breaking main business transactions
    console.error('Audit logging failed:', err.message);
  }
};

module.exports = {
  logAuditAction
};
