const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../services/notification.service');

const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, targetRole, classId, sectionId, priority, expiresAt } = req.body;

  if (!title || !message) {
    throw new ApiError(400, 'Title and Message are required.');
  }

  // Teacher check: can only target their assigned classes
  if (req.user.role === 'teacher') {
    if (!classId) {
      throw new ApiError(400, 'Teachers must specify a target class for announcements.');
    }
    // Verify assignment
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    const teacherId = teachers[0].id;
    const assignment = await query(
      'SELECT id FROM teacher_assignments WHERE teacher_id = ? AND class_id = ?',
      [teacherId, classId]
    );
    if (assignment.length === 0) {
      throw new ApiError(403, 'You can only post announcements to classes assigned to you.');
    }
  }

  const result = await query(
    `INSERT INTO announcements (created_by, title, message, target_role, class_id, section_id, priority, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.id,
      title,
      message,
      targetRole || 'all',
      classId || null,
      sectionId || null,
      priority || 'medium',
      expiresAt || null
    ]
  );
  const announcementId = result.insertId;

  // --- TRIGGER NOTIFICATIONS ASYNCHRONOUSLY ---
  try {
    let notifyUserIds = [];

    if (classId) {
      // Class specific
      let studentSql = 'SELECT user_id FROM student_enrollments se JOIN students s ON se.student_id = s.id WHERE se.class_id = ?';
      const studentParams = [classId];
      if (sectionId) {
        studentSql += ' AND se.section_id = ?';
        studentParams.push(sectionId);
      }
      const students = await query(studentSql, studentParams);
      notifyUserIds.push(...students.map(s => s.user_id));

      // Also get parents of these students
      const parentSql = `
        SELECT p.user_id FROM parents p
        JOIN parent_student_links l ON p.id = l.parent_id
        JOIN student_enrollments se ON l.student_id = se.student_id
        WHERE se.class_id = ?
      `;
      const parents = await query(parentSql, [classId]);
      notifyUserIds.push(...parents.map(p => p.user_id));
    } else {
      // Role specific or School wide
      let userSql = 'SELECT id FROM users WHERE status = "active"';
      const userParams = [];

      if (targetRole && targetRole !== 'all') {
        userSql += ' AND role = ?';
        userParams.push(targetRole);
      }

      const users = await query(userSql, userParams);
      notifyUserIds.push(...users.map(u => u.id));
    }

    // Filter duplicates and remove the author themselves
    notifyUserIds = [...new Set(notifyUserIds)].filter(id => id !== req.user.id);

    // Batch insert notifications
    for (const userId of notifyUserIds) {
      await createNotification(
        userId,
        'New Announcement',
        title,
        'announcement',
        'announcements',
        announcementId
      );
    }
  } catch (notifErr) {
    console.error('Failed to dispatch notifications for announcement:', notifErr.message);
  }

  return ApiResponse.success(res, 201, { id: announcementId }, 'Announcement posted successfully.');
});

const getAnnouncements = asyncHandler(async (req, res) => {
  let sql = `
    SELECT a.*, u.full_name as author_name, u.role as author_role, c.name as class_name, sec.name as section_name
    FROM announcements a
    JOIN users u ON a.created_by = u.id
    LEFT JOIN classes c ON a.class_id = c.id
    LEFT JOIN sections sec ON a.section_id = sec.id
    WHERE (a.expires_at IS NULL OR a.expires_at > NOW())
  `;
  const params = [];

  if (req.user.role === 'student') {
    // Get student enrollment class/section
    const enrolled = await query(
      `SELECT class_id, section_id FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       WHERE s.user_id = ? AND se.enrollment_status = 'active'`,
      [req.user.id]
    );

    if (enrolled.length > 0) {
      const { class_id, section_id } = enrolled[0];
      sql += ` AND (
        (a.target_role IN ('all', 'student') AND a.class_id IS NULL)
        OR (a.class_id = ? AND (a.section_id = ? OR a.section_id IS NULL))
      )`;
      params.push(class_id, section_id);
    } else {
      sql += ' AND a.target_role IN (\'all\', \'student\') AND a.class_id IS NULL';
    }

  } else if (req.user.role === 'parent') {
    // Get linked children class/section
    const children = await query(
      `SELECT se.class_id, se.section_id FROM student_enrollments se
       JOIN parent_student_links l ON se.student_id = l.student_id
       JOIN parents p ON l.parent_id = p.id
       WHERE p.user_id = ? AND se.enrollment_status = 'active'`,
      [req.user.id]
    );

    if (children.length > 0) {
      const conditions = [];
      children.forEach(c => {
        conditions.push('(a.class_id = ? AND (a.section_id = ? OR a.section_id IS NULL))');
        params.push(c.class_id, c.section_id);
      });
      sql += ` AND (
        (a.target_role IN ('all', 'parent') AND a.class_id IS NULL)
        OR (${conditions.join(' OR ')})
      )`;
    } else {
      sql += ' AND a.target_role IN (\'all\', \'parent\') AND a.class_id IS NULL';
    }
  }

  sql += ' ORDER BY a.created_at DESC';
  const results = await query(sql, params);
  return ApiResponse.success(res, 200, results, 'Announcements retrieved successfully.');
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = await query('SELECT * FROM announcements WHERE id = ?', [id]);
  if (rows.length === 0) throw new ApiError(404, 'Announcement not found.');
  const ann = rows[0];

  // Restrict editing to author
  if (req.user.role !== 'admin' && ann.created_by !== req.user.id) {
    throw new ApiError(403, 'Access denied. You can only edit announcements created by you.');
  }

  const { title, message, targetRole, classId, sectionId, priority, expiresAt } = req.body;

  const fields = [];
  const params = [];
  if (title) { fields.push('title = ?'); params.push(title); }
  if (message) { fields.push('message = ?'); params.push(message); }
  if (targetRole) { fields.push('target_role = ?'); params.push(targetRole); }
  if (classId !== undefined) { fields.push('class_id = ?'); params.push(classId); }
  if (sectionId !== undefined) { fields.push('section_id = ?'); params.push(sectionId); }
  if (priority) { fields.push('priority = ?'); params.push(priority); }
  if (expiresAt !== undefined) { fields.push('expires_at = ?'); params.push(expiresAt); }

  if (fields.length > 0) {
    params.push(id);
    await query(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  return ApiResponse.success(res, 200, {}, 'Announcement updated successfully.');
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = await query('SELECT * FROM announcements WHERE id = ?', [id]);
  if (rows.length === 0) throw new ApiError(404, 'Announcement not found.');
  const ann = rows[0];

  if (req.user.role !== 'admin' && ann.created_by !== req.user.id) {
    throw new ApiError(403, 'Access denied. You can only delete announcements created by you.');
  }

  await query('DELETE FROM announcements WHERE id = ?', [id]);
  return ApiResponse.success(res, 200, {}, 'Announcement deleted successfully.');
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
};
