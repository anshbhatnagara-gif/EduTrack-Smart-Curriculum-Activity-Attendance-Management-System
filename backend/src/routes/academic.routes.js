const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academic.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validateRequest = require('../middleware/validateRequest');

const {
  sessionRules,
  classRules,
  sectionRules,
  subjectRules,
  teacherAssignmentRules,
  studentEnrollmentRules
} = require('../validators/academic.validator');

// Authenticated users only
router.use(authenticate);

// --- Academic Sessions ---
router.get('/sessions', academicController.getSessions);
router.post('/sessions', authorizeRoles('admin'), sessionRules, validateRequest, academicController.createSession);
router.put('/sessions/:id', authorizeRoles('admin'), sessionRules, validateRequest, academicController.updateSession);

// --- Classes ---
router.get('/classes', academicController.getClasses);
router.post('/classes', authorizeRoles('admin'), classRules, validateRequest, academicController.createClass);
router.put('/classes/:id', authorizeRoles('admin'), classRules, validateRequest, academicController.updateClass);

// --- Sections ---
router.get('/sections', academicController.getSections);
router.post('/sections', authorizeRoles('admin'), sectionRules, validateRequest, academicController.createSection);
router.put('/sections/:id', authorizeRoles('admin'), sectionRules, validateRequest, academicController.updateSection);

// --- Subjects ---
router.get('/subjects', academicController.getSubjects);
router.post('/subjects', authorizeRoles('admin'), subjectRules, validateRequest, academicController.createSubject);
router.get('/subjects/:id', academicController.getSubjectById);
router.put('/subjects/:id', authorizeRoles('admin'), subjectRules, validateRequest, academicController.updateSubject);

// --- Teacher Assignments ---
router.get('/assignments', academicController.getTeacherAssignments);
router.post('/assignments', authorizeRoles('admin'), teacherAssignmentRules, validateRequest, academicController.assignTeacher);
router.delete('/assignments/:id', authorizeRoles('admin'), academicController.removeTeacherAssignment);

// --- Student Enrollments ---
router.get('/enrollments', academicController.getEnrollments);
router.post('/enrollments', authorizeRoles('admin'), studentEnrollmentRules, validateRequest, academicController.enrollStudent);
router.put('/enrollments/:id', authorizeRoles('admin'), academicController.updateEnrollment);

module.exports = router;
