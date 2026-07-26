const { query, getTransaction } = require('../config/database');
const ApiError = require('../utils/ApiError');
const calculateAttendance = require('../utils/calculateAttendance');
const { createNotification } = require('./notification.service');

// 1. Get Assigned Classes and Subjects for Teacher
const getTeacherAssignments = async (userId) => {
  // Fetch teacher ID from user_id
  const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
  if (teachers.length === 0) {
    throw new ApiError(403, 'User is not registered as a teacher.');
  }
  const teacherId = teachers[0].id;

  const sql = `
    SELECT ta.id as assignment_id, ta.class_id, c.name as class_name,
           ta.section_id, sec.name as section_name,
           ta.subject_id, sub.name as subject_name,
           ta.academic_session_id, s.name as session_name
    FROM teacher_assignments ta
    JOIN classes c ON ta.class_id = c.id
    JOIN sections sec ON ta.section_id = sec.id
    JOIN subjects sub ON ta.subject_id = sub.id
    JOIN academic_sessions s ON ta.academic_session_id = s.id
    WHERE ta.teacher_id = ? AND s.is_active = 1
  `;
  return query(sql, [teacherId]);
};

// 2. Get active students enrolled in class/section for marking
const getStudentsForAttendance = async (classId, sectionId, academicSessionId) => {
  const sql = `
    SELECT s.id as student_id, u.full_name, s.admission_number, se.roll_number
    FROM student_enrollments se
    JOIN students s ON se.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE se.class_id = ? AND se.section_id = ? AND se.academic_session_id = ? AND se.enrollment_status = 'active'
    ORDER BY CAST(se.roll_number AS UNSIGNED) ASC, u.full_name ASC
  `;
  return query(sql, [classId, sectionId, academicSessionId]);
};

// 3. Check low-attendance warning
const checkAndTriggerWarning = async (studentId, subjectId, tx = null) => {
  const q = tx ? tx.execute.bind(tx) : query;
  
  // Fetch all attendance records for this student and subject
  const sql = `
    SELECT ar.status
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.attendance_session_id = s.id
    WHERE ar.student_id = ? AND s.subject_id = ?
  `;
  const records = await q(sql, [studentId, subjectId]);
  
  const stats = calculateAttendance(records);
  
  // Get subject name
  const subjects = await q('SELECT name FROM subjects WHERE id = ?', [subjectId]);
  const subjectName = subjects[0]?.name || 'Subject';

  // Get student user_id and details
  const studentRows = await q(
    'SELECT u.id as user_id, u.full_name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
    [studentId]
  );
  const studentUser = studentRows[0];

  if (stats.percentage < 75.00 && stats.totalClasses >= 3) { // Trigger only if at least 3 classes occurred to prevent noise
    // Check if warning already exists and is unresolved
    const warningCheck = await q(
      `SELECT id FROM attendance_warnings
       WHERE student_id = ? AND subject_id = ? AND status = 'unresolved'`,
      [studentId, subjectId]
    );

    if (warningCheck.length === 0) {
      // Create warning
      const message = `Attendance for ${studentUser.full_name} in ${subjectName} is ${stats.percentage}%, which is below the required 75%.`;
      await q(
        `INSERT INTO attendance_warnings (student_id, subject_id, attendance_percentage, warning_level, message, status)
         VALUES (?, ?, ?, 'low', ?, 'unresolved')`,
        [studentId, subjectId, stats.percentage, message]
      );

      // Notify student
      if (studentUser) {
        await createNotification(
          studentUser.user_id,
          'Low Attendance Warning',
          `Your attendance in ${subjectName} is ${stats.percentage}%, which is below 75%.`,
          'low_attendance',
          'subjects',
          subjectId
        );
      }

      // Notify linked parents
      const parents = await q(
        `SELECT p.user_id FROM parents p
         JOIN parent_student_links l ON p.id = l.parent_id
         WHERE l.student_id = ?`,
        [studentId]
      );

      for (const p of parents) {
        await createNotification(
          p.user_id,
          'Child Low Attendance Warning',
          `Your child ${studentUser.full_name}'s attendance in ${subjectName} is ${stats.percentage}%, which is below 75%.`,
          'low_attendance',
          'students',
          studentId
        );
      }
    }
  } else if (stats.percentage >= 75.00) {
    // Resolve warning if attendance recovered
    await q(
      `UPDATE attendance_warnings
       SET status = 'resolved', resolved_at = NOW()
       WHERE student_id = ? AND subject_id = ? AND status = 'unresolved'`,
      [studentId, subjectId]
    );
  }
};

// 4. Submit bulk attendance records
const submitAttendance = async (user, data) => {
  const { classId, sectionId, subjectId, academicSessionId, attendanceDate, lectureNumber, startTime, endTime, records } = data;

  // Verify authorization if user is a teacher
  if (user.role === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    if (teachers.length === 0) throw new ApiError(403, 'Teacher record not found.');
    const teacherId = teachers[0].id;

    const assignment = await query(
      `SELECT id FROM teacher_assignments
       WHERE teacher_id = ? AND class_id = ? AND section_id = ? AND subject_id = ? AND academic_session_id = ?`,
      [teacherId, classId, sectionId, subjectId, academicSessionId]
    );

    if (assignment.length === 0) {
      throw new ApiError(403, 'You are not assigned to mark attendance for this class and subject.');
    }
  }

  // Get active teacher_id for the session
  let assignedTeacherId;
  if (user.role === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    assignedTeacherId = teachers[0].id;
  } else {
    // Admin user: lookup assigned teacher, default to first or admin user placeholder?
    // Let's lookup teacher assignment, if none, use a dummy or throw
    const ass = await query(
      'SELECT teacher_id FROM teacher_assignments WHERE class_id = ? AND section_id = ? AND subject_id = ? AND academic_session_id = ?',
      [classId, sectionId, subjectId, academicSessionId]
    );
    if (ass.length > 0) {
      assignedTeacherId = ass[0].teacher_id;
    } else {
      // Find any teacher or throw
      const t = await query('SELECT id FROM teachers LIMIT 1');
      if (t.length === 0) throw new ApiError(400, 'No teachers found in system. Seed teachers first.');
      assignedTeacherId = t[0].id;
    }
  }

  const tx = await getTransaction();
  try {
    // Check duplicate session
    const dup = await tx.execute(
      `SELECT id FROM attendance_sessions
       WHERE class_id = ? AND section_id = ? AND subject_id = ? AND attendance_date = ? AND lecture_number = ? AND academic_session_id = ?`,
      [classId, sectionId, subjectId, attendanceDate, lectureNumber, academicSessionId]
    );

    if (dup.length > 0) {
      throw new ApiError(400, 'Attendance has already been marked for this subject, lecture number and date.');
    }

    // Insert session
    const sessionRes = await tx.execute(
      `INSERT INTO attendance_sessions (class_id, section_id, subject_id, teacher_id, academic_session_id, attendance_date, lecture_number, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [classId, sectionId, subjectId, assignedTeacherId, academicSessionId, attendanceDate, lectureNumber, startTime, endTime]
    );
    const sessionId = sessionRes.insertId;

    // Insert records
    for (const rec of records) {
      await tx.execute(
        `INSERT INTO attendance_records (attendance_session_id, student_id, status, remarks, marked_by)
         VALUES (?, ?, ?, ?, ?)`,
        [sessionId, rec.studentId, rec.status, rec.remarks || null, user.id]
      );

      // If student is marked absent, trigger instant notification
      if (rec.status === 'absent') {
        const studUser = await tx.execute(
          'SELECT u.id as user_id, u.full_name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
          [rec.studentId]
        );
        const studentUser = studUser[0];
        
        if (studentUser) {
          // Notify Student
          await createNotification(
            studentUser.user_id,
            'Absent Notification',
            `You were marked Absent on ${attendanceDate} for lecture ${lectureNumber}.`,
            'attendance_absent',
            'attendance_sessions',
            sessionId
          );

          // Notify Parents
          const parents = await tx.execute(
            `SELECT p.user_id FROM parents p
             JOIN parent_student_links l ON p.id = l.parent_id
             WHERE l.student_id = ?`,
            [rec.studentId]
          );

          for (const parent of parents) {
            await createNotification(
              parent.user_id,
              'Child Absent Alert',
              `Your child ${studentUser.full_name} was marked Absent on ${attendanceDate} for lecture ${lectureNumber}.`,
              'attendance_absent',
              'students',
              rec.studentId
            );
          }
        }
      }

      // Check warnings
      await checkAndTriggerWarning(rec.studentId, subjectId, tx);
    }

    await tx.commit();
    return { sessionId };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

// 5. Get attendance sessions lists
const getAttendanceSessions = async (params) => {
  const { classId, sectionId, subjectId, startDate, endDate, academicSessionId } = params;
  let sql = `
    SELECT s.*, c.name as class_name, sec.name as section_name, sub.name as subject_name, u.full_name as teacher_name
    FROM attendance_sessions s
    JOIN classes c ON s.class_id = c.id
    JOIN sections sec ON s.section_id = sec.id
    JOIN subjects sub ON s.subject_id = sub.id
    JOIN teachers t ON s.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const sqlParams = [];

  if (classId) { sql += ' AND s.class_id = ?'; sqlParams.push(classId); }
  if (sectionId) { sql += ' AND s.section_id = ?'; sqlParams.push(sectionId); }
  if (subjectId) { sql += ' AND s.subject_id = ?'; sqlParams.push(subjectId); }
  if (academicSessionId) { sql += ' AND s.academic_session_id = ?'; sqlParams.push(academicSessionId); }
  if (startDate) { sql += ' AND s.attendance_date >= ?'; sqlParams.push(startDate); }
  if (endDate) { sql += ' AND s.attendance_date <= ?'; sqlParams.push(endDate); }

  sql += ' ORDER BY s.attendance_date DESC, s.lecture_number ASC';
  return query(sql, sqlParams);
};

// 6. Get attendance session details and student lists
const getAttendanceSessionDetails = async (id) => {
  const sessionRows = await query(
    `SELECT s.*, c.name as class_name, sec.name as section_name, sub.name as subject_name, u.full_name as teacher_name
     FROM attendance_sessions s
     JOIN classes c ON s.class_id = c.id
     JOIN sections sec ON s.section_id = sec.id
     JOIN subjects sub ON s.subject_id = sub.id
     JOIN teachers t ON s.teacher_id = t.id
     JOIN users u ON t.user_id = u.id
     WHERE s.id = ?`,
    [id]
  );

  if (sessionRows.length === 0) {
    throw new ApiError(404, 'Attendance session not found.');
  }

  const records = await query(
    `SELECT r.id as record_id, r.student_id, u.full_name as student_name, s.admission_number, se.roll_number, r.status, r.remarks, r.marked_at, r.updated_at
     FROM attendance_records r
     JOIN students s ON r.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN student_enrollments se ON s.id = se.student_id AND se.enrollment_status = 'active'
     WHERE r.attendance_session_id = ?
     ORDER BY CAST(se.roll_number AS UNSIGNED) ASC, u.full_name ASC`,
    [id]
  );

  return {
    session: sessionRows[0],
    records
  };
};

// 7. Correct individual attendance record
const correctAttendanceRecord = async (recordId, newStatus, reason, user, ipAddress = null, userAgent = null) => {
  const records = await query(
    `SELECT r.*, s.teacher_id, s.class_id, s.subject_id, s.academic_session_id
     FROM attendance_records r
     JOIN attendance_sessions s ON r.attendance_session_id = s.id
     WHERE r.id = ?`,
    [recordId]
  );

  if (records.length === 0) {
    throw new ApiError(404, 'Attendance record not found.');
  }

  const record = records[0];

  // Role validation
  if (user.role === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    if (teachers.length === 0 || teachers[0].id !== record.teacher_id) {
      throw new ApiError(403, 'Access denied. You can only edit attendance for classes assigned to you.');
    }
  }

  const oldStatus = record.status;
  if (oldStatus === newStatus) {
    throw new ApiError(400, 'New status is same as current status.');
  }

  const tx = await getTransaction();
  try {
    // Update record
    await tx.execute(
      `UPDATE attendance_records
       SET status = ?, edited_by = ?, correction_reason = ?
       WHERE id = ?`,
      [newStatus, user.id, reason, recordId]
    );

    // Insert audit log
    await tx.execute(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, 'CORRECT_ATTENDANCE', 'attendance_records', ?, ?, ?, ?, ?)`,
      [
        user.id,
        recordId,
        JSON.stringify({ status: oldStatus }),
        JSON.stringify({ status: newStatus, reason }),
        ipAddress,
        userAgent
      ]
    );

    // Recalculate warnings
    await checkAndTriggerWarning(record.student_id, record.subject_id, tx);

    await tx.commit();
    return { recordId, status: newStatus };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

// 8. Get student overall and subject-wise stats
const getStudentStats = async (studentId) => {
  // Validate student exists
  const studentCheck = await query('SELECT id FROM students WHERE id = ?', [studentId]);
  if (studentCheck.length === 0) {
    throw new ApiError(404, 'Student not found.');
  }

  // Fetch overall statistics
  const allRecords = await query(
    'SELECT status FROM attendance_records WHERE student_id = ?',
    [studentId]
  );
  const overall = calculateAttendance(allRecords);

  // Fetch subject-wise statistics
  const subjectRecords = await query(
    `SELECT sub.id as subject_id, sub.name as subject_name, sub.subject_code, ar.status
     FROM attendance_records ar
     JOIN attendance_sessions s ON ar.attendance_session_id = s.id
     JOIN subjects sub ON s.subject_id = sub.id
     WHERE ar.student_id = ?`,
    [studentId]
  );

  // Group by subject
  const subjectGroups = {};
  subjectRecords.forEach(r => {
    if (!subjectGroups[r.subject_id]) {
      subjectGroups[r.subject_id] = {
        subjectId: r.subject_id,
        subjectName: r.subject_name,
        subjectCode: r.subject_code,
        records: []
      };
    }
    subjectGroups[r.subject_id].records.push({ status: r.status });
  });

  const subjectStats = Object.values(subjectGroups).map(group => {
    const stats = calculateAttendance(group.records);
    return {
      subjectId: group.subjectId,
      subjectName: group.subjectName,
      subjectCode: group.subjectCode,
      ...stats
    };
  });

  return {
    overall,
    subjectStats
  };
};

module.exports = {
  getTeacherAssignments,
  getStudentsForAttendance,
  submitAttendance,
  getAttendanceSessions,
  getAttendanceSessionDetails,
  correctAttendanceRecord,
  getStudentStats
};
