const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validateRequest = require('../middleware/validateRequest');
const { submitAttendanceRules, correctAttendanceRules } = require('../validators/attendance.validator');

router.use(authenticate);

// GET /api/teacher/assignments (Mapped via app.use('/api/teacher', ...))
// GET /api/attendance/assignments (Mapped via app.use('/api/attendance', ...))
router.get('/assignments', authorizeRoles('teacher', 'admin'), attendanceController.getTeacherAssignments);

// GET /api/attendance/students
router.get('/students', authorizeRoles('teacher', 'admin'), attendanceController.getStudentsForAttendance);

// POST /api/attendance
router.post('/', authorizeRoles('teacher', 'admin'), submitAttendanceRules, validateRequest, attendanceController.submitAttendance);

// GET /api/attendance/sessions
router.get('/sessions', authorizeRoles('teacher', 'admin'), attendanceController.getAttendanceSessions);

// GET /api/attendance/sessions/:id
router.get('/sessions/:id', authorizeRoles('teacher', 'admin'), attendanceController.getAttendanceSessionDetails);

// PUT /api/attendance/records/:id
router.put('/records/:id', authorizeRoles('teacher', 'admin'), correctAttendanceRules, validateRequest, attendanceController.correctAttendanceRecord);

// GET /api/attendance/student/me
router.get('/student/me', authorizeRoles('student'), attendanceController.getMyStats);

// GET /api/attendance/student/:studentId
router.get('/student/:studentId', authorizeRoles('parent', 'teacher', 'admin'), attendanceController.getStudentStats);

// GET /api/attendance/class/:classId
router.get('/class/:classId', authorizeRoles('teacher', 'admin'), attendanceController.getClassStats);

// GET /api/attendance/reports (Mapped to class level summary check or stats list)
router.get('/reports', authorizeRoles('teacher', 'admin'), (req, res, next) => {
  // Pass forward to classStats if classId query parameter is provided, or return a standard summary list
  if (req.query.classId) {
    req.params.classId = req.query.classId;
    return attendanceController.getClassStats(req, res, next);
  }
  // Otherwise redirect/delegate or return success placeholder
  const ApiResponse = require('../utils/ApiResponse');
  return ApiResponse.success(res, 200, { message: "Attendance reports API. Provide classId query parameter." });
});

module.exports = router;
