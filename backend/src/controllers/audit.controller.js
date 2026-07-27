const auditService = require('../services/audit.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const getAuditLogs = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    throw new ApiError(403, 'Access denied. Audit logs are only accessible to Admin and Teacher roles.');
  }

  const { page, limit, action, entityType, userId } = req.query;

  const result = await auditService.getAuditLogs({
    role: req.user.role,
    userId: req.user.id,
    page,
    limit,
    action,
    entityType,
    targetUserId: userId
  });

  return ApiResponse.success(res, 200, result, 'Audit logs retrieved successfully.');
});

const getAuditLogById = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    throw new ApiError(403, 'Access denied. Audit logs are only accessible to Admin and Teacher roles.');
  }

  const { id } = req.params;
  const log = await auditService.getAuditLogById(id, req.user.role, req.user.id);

  return ApiResponse.success(res, 200, log, 'Audit log details retrieved successfully.');
});

module.exports = {
  getAuditLogs,
  getAuditLogById
};
