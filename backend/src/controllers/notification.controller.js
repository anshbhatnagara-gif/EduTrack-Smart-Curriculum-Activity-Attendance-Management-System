const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id);
  return ApiResponse.success(res, 200, result, 'Notifications retrieved successfully.');
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const success = await notificationService.markAsRead(parseInt(req.params.id, 10), req.user.id);
  if (!success) {
    const ApiError = require('../utils/ApiError');
    throw new ApiError(404, 'Notification not found or access denied.');
  }
  return ApiResponse.success(res, 200, {}, 'Notification marked as read.');
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const count = await notificationService.markAllAsRead(req.user.id);
  return ApiResponse.success(res, 200, { count }, 'All notifications marked as read.');
});

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
