const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marks.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(authenticate);

// Exams CRUD
router.get('/exams', marksController.getExams);
router.post('/exams', authorizeRoles('admin'), marksController.createExam);

// Marks CRUD
router.post('/', authorizeRoles('teacher', 'admin'), marksController.addMarks);
router.put('/:id', authorizeRoles('teacher', 'admin'), marksController.updateMarks);

// Retrieve Marks
router.get('/student/me', authorizeRoles('student'), marksController.getMyMarks);
router.get('/student/:studentId', authorizeRoles('parent', 'teacher', 'admin'), marksController.getStudentMarks);
router.get('/class/:classId', authorizeRoles('teacher', 'admin'), marksController.getClassMarks);

module.exports = router;
