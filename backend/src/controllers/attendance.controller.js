const attendanceService = require('../services/attendance.service');
const academicService = require('../services/academic.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { query } = require('../config/database');

const getTeacherAssignments = asyncHandler(async (req, res) => {
  const assignments = await attendanceService.getTeacherAssignments(req.user.id);
  return ApiResponse.success(res, 200, assignments, 'Teacher assignments retrieved successfully.');
});

const getStudentsForAttendance = asyncHandler(async (req, res) => {
  const { classId, sectionId, academicSessionId } = req.query;
  if (!classId || !sectionId || !academicSessionId) {
    throw new ApiError(400, 'classId, sectionId, and academicSessionId are required query parameters.');
  }

  const students = await attendanceService.getStudentsForAttendance(
    parseInt(classId, 10),
    parseInt(sectionId, 10),
    parseInt(academicSessionId, 10)
  );
  return ApiResponse.success(res, 200, students, 'Students list retrieved for attendance marking.');
});

const submitAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.submitAttendance(req.user, req.body);
  return ApiResponse.success(res, 201, result, 'Attendance marked successfully.');
});

const getAttendanceSessions = asyncHandler(async (req, res) => {
  const params = {
    classId: req.query.classId ? parseInt(req.query.classId, 10) : null,
    sectionId: req.query.sectionId ? parseInt(req.query.sectionId, 10) : null,
    subjectId: req.query.subjectId ? parseInt(req.query.subjectId, 10) : null,
    academicSessionId: req.query.academicSessionId ? parseInt(req.query.academicSessionId, 10) : null,
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null
  };

  const sessions = await attendanceService.getAttendanceSessions(params);
  return ApiResponse.success(res, 200, sessions, 'Attendance sessions retrieved successfully.');
});

const getAttendanceSessionDetails = asyncHandler(async (req, res) => {
  const details = await attendanceService.getAttendanceSessionDetails(req.params.id);
  return ApiResponse.success(res, 200, details, 'Attendance session details retrieved successfully.');
});

const correctAttendanceRecord = asyncHandler(async (req, res) => {
  const { status, correctionReason } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  const result = await attendanceService.correctAttendanceRecord(
    parseInt(req.params.id, 10),
    status,
    correctionReason,
    req.user,
    ipAddress,
    userAgent
  );

  return ApiResponse.success(res, 200, result, 'Attendance record corrected successfully.');
});

const getMyStats = asyncHandler(async (req, res) => {
  // Find student ID corresponding to user_id
  const studentRows = await query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
  if (studentRows.length === 0) {
    throw new ApiError(404, 'Student profile record not found.');
  }
  const studentId = studentRows[0].id;

  const stats = await attendanceService.getStudentStats(studentId);
  return ApiResponse.success(res, 200, stats, 'Your attendance statistics retrieved successfully.');
});

const getStudentStats = asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);

  // If user is a parent, verify student is linked
  if (req.user.role === 'parent') {
    const parentRows = await query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parentRows.length === 0) throw new ApiError(404, 'Parent profile record not found.');
    const parentId = parentRows[0].id;

    const link = await query(
      'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );
    if (link.length === 0) {
      throw new ApiError(403, 'Access denied. You are not linked to this student.');
    }
  }

  const stats = await attendanceService.getStudentStats(studentId);
  return ApiResponse.success(res, 200, stats, 'Student attendance statistics retrieved successfully.');
});

// Class level summary report
const getClassStats = asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.classId, 10);
  const sectionId = req.query.sectionId ? parseInt(req.query.sectionId, 10) : null;

  let sql = `
    SELECT ar.status, ar.student_id
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.attendance_session_id = s.id
    WHERE s.class_id = ?
  `;
  const params = [classId];
  if (sectionId) {
    sql += ' AND s.section_id = ?';
    params.push(sectionId);
  }

  const records = await query(sql, params);
  const calculateAttendance = require('../utils/calculateAttendance');
  const summary = calculateAttendance(records);

  return ApiResponse.success(res, 200, summary, 'Class attendance statistics retrieved successfully.');
});

module.exports = {
  getTeacherAssignments,
  getStudentsForAttendance,
  submitAttendance,
  getAttendanceSessions,
  getAttendanceSessionDetails,
  correctAttendanceRecord,
  getMyStats,
  getStudentStats,
  getClassStats
};
