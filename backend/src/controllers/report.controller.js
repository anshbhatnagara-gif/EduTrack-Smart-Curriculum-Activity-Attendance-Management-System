const reportService = require('../services/report.service');
const attendanceService = require('../services/attendance.service');
const marksController = require('./marks.controller');
const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const calculateAttendance = require('../utils/calculateAttendance');

const getAdminDashboard = asyncHandler(async (req, res) => {
  const stats = await reportService.getAdminDashboardStats();
  return ApiResponse.success(res, 200, stats, 'Admin dashboard metrics retrieved successfully.');
});

const getTeacherDashboard = asyncHandler(async (req, res) => {
  const stats = await reportService.getTeacherDashboardStats(req.user.id);
  if (!stats) throw new ApiError(404, 'Teacher profile record not found.');
  return ApiResponse.success(res, 200, stats, 'Teacher dashboard metrics retrieved successfully.');
});

const getStudentDashboard = asyncHandler(async (req, res) => {
  // Find student ID corresponding to user_id
  const studentRows = await query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
  if (studentRows.length === 0) throw new ApiError(404, 'Student profile record not found.');
  const studentId = studentRows[0].id;

  // Attendance stats
  const attStats = await attendanceService.getStudentStats(studentId);

  // Today's schedule
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const enrollment = await query(
    'SELECT class_id, section_id, academic_session_id FROM student_enrollments WHERE student_id = ? AND enrollment_status = "active"',
    [studentId]
  );

  let todaySchedule = [];
  let pendingAssignments = [];
  let recentMarks = [];
  let classAnnouncements = [];

  if (enrollment.length > 0) {
    const { class_id, section_id, academic_session_id } = enrollment[0];

    // Today's schedule
    todaySchedule = await query(
      `SELECT te.*, sub.name as subject_name, sub.subject_code, u.full_name as teacher_name
       FROM timetable_entries te
       JOIN subjects sub ON te.subject_id = sub.id
       JOIN teachers t ON te.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE te.class_id = ? AND te.section_id = ? AND te.day_of_week = ? AND te.academic_session_id = ?
       ORDER BY te.start_time ASC`,
      [class_id, section_id, dayName, academic_session_id]
    );

    // Pending assignments
    const totalAssignments = await query(
      `SELECT a.*, sub.name as subject_name, sub.subject_code
       FROM assignments a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.class_id = ? AND a.section_id = ? AND a.status = 'active' AND a.due_date > NOW()`,
      [class_id, section_id]
    );
    const submissions = await query(
      'SELECT assignment_id FROM assignment_submissions WHERE student_id = ?',
      [studentId]
    );
    const submittedIds = submissions.map(s => s.assignment_id);
    pendingAssignments = totalAssignments.filter(a => !submittedIds.includes(a.id));

    // Recent marks
    recentMarks = await query(
      `SELECT m.*, e.name as exam_name, sub.name as subject_name, sub.subject_code
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       JOIN subjects sub ON m.subject_id = sub.id
       WHERE m.student_id = ?
       ORDER BY m.created_at DESC LIMIT 5`,
      [studentId]
    );

    // Announcements targeting student class
    classAnnouncements = await query(
      `SELECT a.*, u.full_name as author_name FROM announcements a
       JOIN users u ON a.created_by = u.id
       WHERE (a.target_role IN ('all', 'student') AND a.class_id IS NULL)
          OR (a.class_id = ? AND (a.section_id = ? OR a.section_id IS NULL))
          AND (a.expires_at IS NULL OR a.expires_at > NOW())
       ORDER BY a.created_at DESC LIMIT 5`,
      [class_id, section_id]
    );
  }

  // Notifications
  const notifications = await query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
    [req.user.id]
  );

  return ApiResponse.success(res, 200, {
    overallAttendancePercentage: attStats.overall.percentage,
    subjectAttendance: attStats.subjectStats,
    pendingAssignments,
    recentMarks,
    todaySchedule,
    announcements: classAnnouncements,
    notifications
  }, 'Student dashboard metrics retrieved successfully.');
});

const getParentDashboard = asyncHandler(async (req, res) => {
  const parentRows = await query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
  if (parentRows.length === 0) throw new ApiError(404, 'Parent profile record not found.');
  const parentId = parentRows[0].id;

  // Retrieve linked children
  const children = await query(
    `SELECT s.id as student_id, u.full_name, s.admission_number, s.roll_number
     FROM parent_student_links l
     JOIN students s ON l.student_id = s.id
     JOIN users u ON s.user_id = u.id
     WHERE l.parent_id = ?`,
    [parentId]
  );

  const childrenReports = [];

  for (const child of children) {
    const studentId = child.student_id;
    // Child attendance
    const attendanceStats = await attendanceService.getStudentStats(studentId);

    // Child marks
    const marksList = await query(
      `SELECT m.*, e.name as exam_name, sub.name as subject_name
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       JOIN subjects sub ON m.subject_id = sub.id
       WHERE m.student_id = ?
       ORDER BY m.created_at DESC LIMIT 5`,
      [studentId]
    );

    // Child pending assignments
    const enrollment = await query(
      'SELECT class_id, section_id FROM student_enrollments WHERE student_id = ? AND enrollment_status = "active"',
      [studentId]
    );
    let pendingAssignments = [];
    if (enrollment.length > 0) {
      const { class_id, section_id } = enrollment[0];
      const totalAssignments = await query(
        'SELECT a.id, a.title, a.due_date, sub.name as subject_name FROM assignments a JOIN subjects sub ON a.subject_id = sub.id WHERE a.class_id = ? AND a.section_id = ? AND a.status = "active"',
        [class_id, section_id]
      );
      const submissions = await query('SELECT assignment_id FROM assignment_submissions WHERE student_id = ?', [studentId]);
      const submittedIds = submissions.map(s => s.assignment_id);
      pendingAssignments = totalAssignments.filter(a => !submittedIds.includes(a.id));
    }

    // Warnings
    const warnings = await query(
      'SELECT * FROM attendance_warnings WHERE student_id = ? AND status = "unresolved"',
      [studentId]
    );

    // Child announcements targeting child class
    let announcements = [];
    if (enrollment.length > 0) {
      announcements = await query(
        `SELECT a.*, u.full_name as author_name FROM announcements a
         JOIN users u ON a.created_by = u.id
         WHERE (a.target_role IN ('all', 'parent') AND a.class_id IS NULL)
            OR (a.class_id = ? AND (a.section_id = ? OR a.section_id IS NULL))
         ORDER BY a.created_at DESC LIMIT 5`,
        [enrollment[0].class_id, enrollment[0].section_id]
      );
    }

    childrenReports.push({
      studentId,
      studentName: child.full_name,
      admissionNumber: child.admission_number,
      rollNumber: child.roll_number,
      overallAttendancePercentage: attendanceStats.overall.percentage,
      subjectAttendance: attendanceStats.subjectStats,
      recentMarks: marksList,
      pendingAssignments,
      warnings,
      announcements
    });
  }

  return ApiResponse.success(res, 200, childrenReports, 'Parent dashboard metrics retrieved successfully.');
});

// GET /api/reports/attendance
const getAttendanceReport = asyncHandler(async (req, res) => {
  const { classId, sectionId, subjectId, studentId, startDate, endDate } = req.query;

  let sql = `
    SELECT ar.id as record_id, s.attendance_date, s.lecture_number, sub.name as subject_name,
           u.full_name as student_name, stud.admission_number, ar.status, ar.remarks
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.attendance_session_id = s.id
    JOIN subjects sub ON s.subject_id = sub.id
    JOIN students stud ON ar.student_id = stud.id
    JOIN users u ON stud.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (classId) { sql += ' AND s.class_id = ?'; params.push(classId); }
  if (sectionId) { sql += ' AND s.section_id = ?'; params.push(sectionId); }
  if (subjectId) { sql += ' AND s.subject_id = ?'; params.push(subjectId); }
  if (studentId) { sql += ' AND ar.student_id = ?'; params.push(studentId); }
  if (startDate) { sql += ' AND s.attendance_date >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND s.attendance_date <= ?'; params.push(endDate); }

  sql += ' ORDER BY s.attendance_date DESC, s.lecture_number ASC, u.full_name ASC';
  
  const results = await query(sql, params);
  return ApiResponse.success(res, 200, results, 'Attendance report generated successfully.');
});

// GET /api/reports/performance: overall risk status list of students in a class
const getPerformanceReport = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  if (!classId) {
    throw new ApiError(400, 'classId is a required query parameter.');
  }

  // Get all active enrolled students in this class
  const students = await query(
    `SELECT s.id as student_id, u.full_name, s.admission_number, se.roll_number, sec.name as section_name
     FROM student_enrollments se
     JOIN students s ON se.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN sections sec ON se.section_id = sec.id
     WHERE se.class_id = ? AND se.enrollment_status = 'active'`,
    [classId]
  );

  const reportList = [];

  for (const stud of students) {
    const studentId = stud.student_id;

    // Fetch marks percentage
    const marksList = await query('SELECT marks_obtained, maximum_marks FROM marks WHERE student_id = ?', [studentId]);
    let marksPct = 0;
    if (marksList.length > 0) {
      let totalMax = 0;
      let totalObt = 0;
      marksList.forEach(m => {
        totalMax += parseFloat(m.maximum_marks);
        totalObt += parseFloat(m.marks_obtained);
      });
      marksPct = (totalObt / totalMax) * 100;
    } else {
      // Default placeholder if no exam recorded yet: treat as GOOD or AVERAGE
      marksPct = 70.00; 
    }

    // Fetch attendance stats
    const allRecords = await query('SELECT status FROM attendance_records WHERE student_id = ?', [studentId]);
    const attStats = calculateAttendance(allRecords);

    // Fetch pending assignments
    const enrolled = await query(
      'SELECT class_id, section_id FROM student_enrollments WHERE student_id = ? AND enrollment_status = "active"',
      [studentId]
    );
    let pendingCount = 0;
    if (enrolled.length > 0) {
      const { class_id, section_id } = enrolled[0];
      const totalAssignments = await query(
        'SELECT id FROM assignments WHERE class_id = ? AND section_id = ? AND status = "active"',
        [class_id, section_id]
      );
      const submissions = await query('SELECT assignment_id FROM assignment_submissions WHERE student_id = ?', [studentId]);
      const submittedIds = submissions.map(s => s.assignment_id);
      pendingCount = totalAssignments.filter(a => !submittedIds.includes(a.id)).length;
    }

    // Classification Rules:
    // AT_RISK: Attendance < 60% or Marks < 40% or pending >= 5
    // NEEDS_ATTENTION: Attendance < 75% or Marks < 50% or pending >= 3
    // GOOD: Attendance >= 85% and Marks >= 70% and pending === 0
    // AVERAGE: others
    let category = 'AVERAGE';
    const reasons = [];

    const attPct = attStats.percentage;

    if (attPct < 60 || marksPct < 40 || pendingCount >= 5) {
      category = 'AT_RISK';
      if (attPct < 60) reasons.push(`Attendance is below 60% (${attPct.toFixed(2)}%)`);
      if (marksPct < 40) reasons.push(`Overall marks average is below 40% (${marksPct.toFixed(2)}%)`);
      if (pendingCount >= 5) reasons.push(`Has ${pendingCount} pending assignments`);
    } else if (attPct < 75 || marksPct < 50 || pendingCount >= 3) {
      category = 'NEEDS_ATTENTION';
      if (attPct < 75) reasons.push(`Attendance is below 75% (${attPct.toFixed(2)}%)`);
      if (marksPct < 50) reasons.push(`Overall marks average is below 50% (${marksPct.toFixed(2)}%)`);
      if (pendingCount >= 3) reasons.push(`Has ${pendingCount} pending assignments`);
    } else if (attPct >= 85 && marksPct >= 70 && pendingCount === 0) {
      category = 'GOOD';
    }

    reportList.push({
      studentId,
      studentName: stud.full_name,
      admissionNumber: stud.admission_number,
      rollNumber: stud.roll_number,
      sectionName: stud.section_name,
      attendancePercentage: attPct,
      marksPercentage: marksPct,
      pendingAssignments: pendingCount,
      riskAnalysis: {
        category,
        reasons
      }
    });
  }

  return ApiResponse.success(res, 200, reportList, 'Performance classification report generated.');
});

module.exports = {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard,
  getParentDashboard,
  getAttendanceReport,
  getPerformanceReport,
  getStudentPerformanceReport: marksController.getStudentPerformanceReport
};
