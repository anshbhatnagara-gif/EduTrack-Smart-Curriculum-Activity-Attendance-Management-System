const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');

const getAuditLogs = async ({ role, userId, page = 1, limit = 20, action, entityType, targetUserId }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (role === 'teacher') {
    conditions.push('a.user_id = ?');
    params.push(userId);
  } else if (role === 'admin' && targetUserId) {
    conditions.push('a.user_id = ?');
    params.push(targetUserId);
  }

  if (action) {
    conditions.push('a.action LIKE ?');
    params.push(`%${action}%`);
  }

  if (entityType) {
    conditions.push('a.entity_type = ?');
    params.push(entityType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) as total FROM audit_logs a ${whereClause}`;
  const countResult = await query(countSql, params);
  const total = countResult[0].total;

  const dataSql = `
    SELECT a.*, u.full_name as user_full_name, u.email as user_email, u.role as user_role
    FROM audit_logs a
    JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const data = await query(dataSql, [...params, limitNum, offset]);

  return {
    logs: data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

const getAuditLogById = async (id, role, userId) => {
  const sql = `
    SELECT a.*, u.full_name as user_full_name, u.email as user_email, u.role as user_role
    FROM audit_logs a
    JOIN users u ON a.user_id = u.id
    WHERE a.id = ?
  `;
  const logs = await query(sql, [id]);

  if (logs.length === 0) {
    throw new ApiError(404, 'Audit log record not found.');
  }

  const log = logs[0];

  if (role === 'teacher' && log.user_id !== userId) {
    throw new ApiError(403, 'Access denied. You can only view your own audit logs.');
  }

  return log;
};

module.exports = {
  getAuditLogs,
  getAuditLogById
};
