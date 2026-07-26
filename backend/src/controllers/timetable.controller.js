const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Time conflict check helper
const checkConflicts = async (data, excludeId = null) => {
  const { academicSessionId, classId, sectionId, teacherId, dayOfWeek, startTime, endTime, roomNumber } = data;

  // Overlap condition: start_time < endTime AND end_time > startTime
  // 1. Teacher Conflict: One teacher having two classes at same time
  let teacherSql = `
    SELECT id FROM timetable_entries
    WHERE teacher_id = ? AND day_of_week = ? AND academic_session_id = ?
      AND start_time < ? AND end_time > ?
  `;
  const teacherParams = [teacherId, dayOfWeek, academicSessionId, endTime, startTime];
  if (excludeId) {
    teacherSql += ' AND id != ?';
    teacherParams.push(excludeId);
  }
  const teacherConflict = await query(teacherSql, teacherParams);
  if (teacherConflict.length > 0) {
    throw new ApiError(400, 'Conflict detected: This teacher is already scheduled for another class at this time.');
  }

  // 2. Class Conflict: One class and section having two subjects at same time
  let classSql = `
    SELECT id FROM timetable_entries
    WHERE class_id = ? AND section_id = ? AND day_of_week = ? AND academic_session_id = ?
      AND start_time < ? AND end_time > ?
  `;
  const classParams = [classId, sectionId, dayOfWeek, academicSessionId, endTime, startTime];
  if (excludeId) {
    classSql += ' AND id != ?';
    classParams.push(excludeId);
  }
  const classConflict = await query(classSql, classParams);
  if (classConflict.length > 0) {
    throw new ApiError(400, 'Conflict detected: This class and section already has a subject scheduled at this time.');
  }

  // 3. Room Conflict: One room being assigned to multiple classes at same time
  let roomSql = `
    SELECT id FROM timetable_entries
    WHERE room_number = ? AND day_of_week = ? AND academic_session_id = ?
      AND start_time < ? AND end_time > ?
  `;
  const roomParams = [roomNumber, dayOfWeek, academicSessionId, endTime, startTime];
  if (excludeId) {
    roomSql += ' AND id != ?';
    roomParams.push(excludeId);
  }
  const roomConflict = await query(roomSql, roomParams);
  if (roomConflict.length > 0) {
    throw new ApiError(400, 'Conflict detected: This room is already occupied by another class at this time.');
  }
};

const createTimetableEntry = asyncHandler(async (req, res) => {
  const { academicSessionId, classId, sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNumber } = req.body;

  if (!academicSessionId || !classId || !sectionId || !subjectId || !teacherId || !dayOfWeek || !startTime || !endTime || !roomNumber) {
    throw new ApiError(400, 'All fields are required.');
  }

  await checkConflicts(req.body);

  const result = await query(
    `INSERT INTO timetable_entries (academic_session_id, class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [academicSessionId, classId, sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNumber]
  );

  return ApiResponse.success(res, 201, { id: result.insertId }, 'Timetable entry created successfully.');
});

// Group entries by day
const groupTimetableByDay = (entries) => {
  const days = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  };

  entries.forEach(entry => {
    if (days[entry.day_of_week]) {
      days[entry.day_of_week].push(entry);
    }
  });

  return days;
};

const getTimetable = asyncHandler(async (req, res) => {
  const classId = req.query.classId ? parseInt(req.query.classId, 10) : null;
  const sectionId = req.query.sectionId ? parseInt(req.query.sectionId, 10) : null;
  const teacherId = req.query.teacherId ? parseInt(req.query.teacherId, 10) : null;

  let sql = `
    SELECT te.*, c.name as class_name, sec.name as section_name, sub.name as subject_name, sub.subject_code, u.full_name as teacher_name
    FROM timetable_entries te
    JOIN classes c ON te.class_id = c.id
    JOIN sections sec ON te.section_id = sec.id
    JOIN subjects sub ON te.subject_id = sub.id
    JOIN teachers t ON te.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (classId) { sql += ' AND te.class_id = ?'; params.push(classId); }
  if (sectionId) { sql += ' AND te.section_id = ?'; params.push(sectionId); }
  if (teacherId) { sql += ' AND te.teacher_id = ?'; params.push(teacherId); }

  sql += ' ORDER BY te.day_of_week, te.start_time ASC';

  const results = await query(sql, params);
  const grouped = groupTimetableByDay(results);

  return ApiResponse.success(res, 200, grouped, 'Timetable retrieved successfully.');
});

const getMyTimetable = asyncHandler(async (req, res) => {
  let sql = `
    SELECT te.*, c.name as class_name, sec.name as section_name, sub.name as subject_name, sub.subject_code, u.full_name as teacher_name
    FROM timetable_entries te
    JOIN classes c ON te.class_id = c.id
    JOIN sections sec ON te.section_id = sec.id
    JOIN subjects sub ON te.subject_id = sub.id
    JOIN teachers t ON te.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teachers.length === 0) throw new ApiError(404, 'Teacher profile record not found.');
    sql += ' AND te.teacher_id = ?';
    params.push(teachers[0].id);

  } else if (req.user.role === 'student') {
    const enrolled = await query(
      `SELECT class_id, section_id FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       WHERE s.user_id = ? AND se.enrollment_status = 'active'`,
      [req.user.id]
    );
    if (enrolled.length === 0) {
      return ApiResponse.success(res, 200, groupTimetableByDay([]), 'No classes enrolled.');
    }
    sql += ' AND te.class_id = ? AND te.section_id = ?';
    params.push(enrolled[0].class_id, enrolled[0].section_id);

  } else if (req.user.role === 'parent') {
    // Parent timetable: returns timetable for each child childId -> timetable
    const parentRows = await query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parentRows.length === 0) throw new ApiError(404, 'Parent profile not found.');
    const parentId = parentRows[0].id;

    const children = await query(
      `SELECT s.id as student_id, u.full_name, se.class_id, se.section_id
       FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN parent_student_links l ON s.id = l.student_id
       WHERE l.parent_id = ? AND se.enrollment_status = 'active'`,
      [parentId]
    );

    const reports = {};
    for (const child of children) {
      const childSlots = await query(sql + ' AND te.class_id = ? AND te.section_id = ?', [child.class_id, child.section_id]);
      reports[child.student_id] = {
        studentName: child.full_name,
        timetable: groupTimetableByDay(childSlots)
      };
    }
    return ApiResponse.success(res, 200, reports, 'Children timetable retrieved successfully.');
  }

  sql += ' ORDER BY te.day_of_week, te.start_time ASC';
  const results = await query(sql, params);
  const grouped = groupTimetableByDay(results);

  return ApiResponse.success(res, 200, grouped, 'Your timetable retrieved successfully.');
});

const updateTimetableEntry = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const entryRows = await query('SELECT * FROM timetable_entries WHERE id = ?', [id]);
  if (entryRows.length === 0) {
    throw new ApiError(404, 'Timetable entry not found.');
  }
  const entry = entryRows[0];

  const { academicSessionId, classId, sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNumber } = req.body;

  const checkData = {
    academicSessionId: academicSessionId || entry.academic_session_id,
    classId: classId || entry.class_id,
    sectionId: sectionId || entry.section_id,
    subjectId: subjectId || entry.subject_id,
    teacherId: teacherId || entry.teacher_id,
    dayOfWeek: dayOfWeek || entry.day_of_week,
    startTime: startTime || entry.start_time,
    endTime: endTime || entry.end_time,
    roomNumber: roomNumber || entry.room_number
  };

  await checkConflicts(checkData, id);

  const fields = [];
  const params = [];
  Object.keys(checkData).forEach(key => {
    // map camelCase to snake_case
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    fields.push(`${snakeKey} = ?`);
    params.push(checkData[key]);
  });

  params.push(id);
  await query(`UPDATE timetable_entries SET ${fields.join(', ')} WHERE id = ?`, params);

  return ApiResponse.success(res, 200, {}, 'Timetable entry updated successfully.');
});

const deleteTimetableEntry = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM timetable_entries WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Timetable entry not found.');
  }
  return ApiResponse.success(res, 200, {}, 'Timetable entry deleted successfully.');
});

module.exports = {
  createTimetableEntry,
  getTimetable,
  getMyTimetable,
  updateTimetableEntry,
  deleteTimetableEntry
};
