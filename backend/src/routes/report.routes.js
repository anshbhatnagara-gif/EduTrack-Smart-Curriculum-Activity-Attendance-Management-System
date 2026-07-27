const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(authenticate);

// Role Dashboard routes
router.get('/admin-dashboard', authorizeRoles('admin'), reportController.getAdminDashboard);
router.get('/teacher-dashboard', authorizeRoles('teacher'), reportController.getTeacherDashboard);
router.get('/student-dashboard', authorizeRoles('student'), reportController.getStudentDashboard);
router.get('/parent-dashboard', authorizeRoles('parent'), reportController.getParentDashboard);

// General report routes
router.get('/attendance', authorizeRoles('teacher', 'admin'), reportController.getAttendanceReport);
router.get('/performance', authorizeRoles('teacher', 'admin'), reportController.getPerformanceReport);
router.get('/student-performance/:studentId', authorizeRoles('parent', 'teacher', 'admin'), reportController.getStudentPerformanceReport);

// Export routes
router.get('/export/attendance', authorizeRoles('admin', 'teacher'), reportController.exportAttendanceReport);
router.get('/export/performance', authorizeRoles('admin', 'teacher'), reportController.exportPerformanceReport);

module.exports = router;
