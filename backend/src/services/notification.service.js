const { query } = require('../config/database');

const createNotification = async (userId, title, message, type, refType = null, refId = null) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, notification_type, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, message, type, refType, refId]
    );
    return result.insertId;
  } catch (error) {
    console.error('Failed to create notification:', error.message);
    // Non-blocking
    return null;
  }
};

const getUserNotifications = async (userId) => {
  return query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
};

const markAsRead = async (id, userId) => {
  const result = await query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
};

const markAllAsRead = async (userId) => {
  const result = await query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows;
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
