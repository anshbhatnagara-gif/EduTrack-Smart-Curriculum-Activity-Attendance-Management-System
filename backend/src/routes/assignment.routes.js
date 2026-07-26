const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const upload = require('../middleware/upload');
const validateRequest = require('../middleware/validateRequest');
const {
  createAssignmentRules,
  submitAssignmentRules,
  evaluateSubmissionRules
} = require('../validators/assignment.validator');

router.use(authenticate);

// --- Assignments Paths (relative to /api/assignments) ---
router.get('/', assignmentController.getAssignments);
router.get('/:id', assignmentController.getAssignmentById);

// Staff and Admin routes
router.post('/', authorizeRoles('teacher', 'admin'), upload.single('file'), createAssignmentRules, validateRequest, assignmentController.createAssignment);
router.put('/:id', authorizeRoles('teacher', 'admin'), upload.single('file'), assignmentController.updateAssignment);
router.delete('/:id', authorizeRoles('teacher', 'admin'), assignmentController.deleteAssignment);

// Submissions relative to an assignment
router.post('/:id/submissions', authorizeRoles('student'), upload.single('file'), submitAssignmentRules, validateRequest, assignmentController.submitAssignment);
router.get('/:id/submissions', authorizeRoles('teacher', 'admin'), assignmentController.getSubmissions);

// --- Submissions Paths (relative to /api/submissions) ---
router.get('/me', authorizeRoles('student'), assignmentController.getMySubmissions);
router.put('/:id/evaluate', authorizeRoles('teacher', 'admin'), evaluateSubmissionRules, validateRequest, assignmentController.evaluateSubmission);

module.exports = router;
