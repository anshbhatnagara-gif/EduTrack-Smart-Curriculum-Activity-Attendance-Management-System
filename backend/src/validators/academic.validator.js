const { body } = require('express-validator');

const sessionRules = [
  body('name')
    .trim().notEmpty().withMessage('Session name is required'),
  body('startDate')
    .trim().notEmpty().withMessage('Start date is required')
    .isISO8601().toDate().withMessage('Invalid start date (YYYY-MM-DD)'),
  body('endDate')
    .trim().notEmpty().withMessage('End date is required')
    .isISO8601().toDate().withMessage('Invalid end date (YYYY-MM-DD)'),
  body('isActive')
    .optional().isBoolean().withMessage('isActive must be a boolean')
];

const classRules = [
  body('name')
    .trim().notEmpty().withMessage('Class name is required'),
  body('numericLevel')
    .isInt({ min: 1 }).withMessage('Numeric level must be a positive integer'),
  body('academicSessionId')
    .isInt().withMessage('Academic session ID must be an integer'),
  body('status')
    .optional().isIn(['active', 'inactive']).withMessage('Invalid status')
];

const sectionRules = [
  body('classId')
    .isInt().withMessage('Class ID must be an integer'),
  body('name')
    .trim().notEmpty().withMessage('Section name is required'),
  body('roomNumber')
    .trim().notEmpty().withMessage('Room number is required'),
  body('capacity')
    .isInt({ min: 1 }).withMessage('Capacity must be a positive integer')
];

const subjectRules = [
  body('subjectCode')
    .trim().notEmpty().withMessage('Subject code is required'),
  body('name')
    .trim().notEmpty().withMessage('Subject name is required'),
  body('description')
    .optional().trim()
];

const teacherAssignmentRules = [
  body('teacherId')
    .isInt().withMessage('Teacher ID must be an integer'),
  body('classId')
    .isInt().withMessage('Class ID must be an integer'),
  body('sectionId')
    .isInt().withMessage('Section ID must be an integer'),
  body('subjectId')
    .isInt().withMessage('Subject ID must be an integer'),
  body('academicSessionId')
    .isInt().withMessage('Academic session ID must be an integer')
];

const studentEnrollmentRules = [
  body('studentId')
    .isInt().withMessage('Student ID must be an integer'),
  body('classId')
    .isInt().withMessage('Class ID must be an integer'),
  body('sectionId')
    .isInt().withMessage('Section ID must be an integer'),
  body('academicSessionId')
    .isInt().withMessage('Academic session ID must be an integer'),
  body('rollNumber')
    .trim().notEmpty().withMessage('Roll number is required'),
  body('enrollmentStatus')
    .optional().isIn(['active', 'completed', 'dropped']).withMessage('Invalid enrollment status')
];

module.exports = {
  sessionRules,
  classRules,
  sectionRules,
  subjectRules,
  teacherAssignmentRules,
  studentEnrollmentRules
};
