const { body } = require('express-validator');

const createAssignmentRules = [
  body('classId')
    .isInt().withMessage('Class ID must be an integer'),
  body('sectionId')
    .isInt().withMessage('Section ID must be an integer'),
  body('subjectId')
    .isInt().withMessage('Subject ID must be an integer'),
  body('title')
    .trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters'),
  body('description')
    .optional().trim(),
  body('dueDate')
    .trim().notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid due date format (must be ISO8601, e.g. YYYY-MM-DD HH:MM)'),
  body('maximumMarks')
    .isFloat({ min: 0 }).withMessage('Maximum marks must be a non-negative number')
];

const submitAssignmentRules = [
  body('submissionText')
    .optional({ nullable: true }).trim()
];

const evaluateSubmissionRules = [
  body('marksObtained')
    .isFloat({ min: 0 }).withMessage('Marks obtained must be a non-negative number'),
  body('teacherFeedback')
    .optional({ nullable: true }).trim()
];

module.exports = {
  createAssignmentRules,
  submitAssignmentRules,
  evaluateSubmissionRules
};
