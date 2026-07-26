const { body } = require('express-validator');

const submitAttendanceRules = [
  body('classId')
    .isInt().withMessage('Class ID must be an integer'),
  body('sectionId')
    .isInt().withMessage('Section ID must be an integer'),
  body('subjectId')
    .isInt().withMessage('Subject ID must be an integer'),
  body('academicSessionId')
    .isInt().withMessage('Academic Session ID must be an integer'),
  body('attendanceDate')
    .trim().notEmpty().withMessage('Attendance date is required')
    .isISO8601().withMessage('Invalid attendance date (YYYY-MM-DD)'),
  body('lectureNumber')
    .isInt({ min: 1 }).withMessage('Lecture number must be a positive integer'),
  body('startTime')
    .trim().notEmpty().withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .trim().notEmpty().withMessage('End time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).withMessage('End time must be in HH:MM format'),
  body('records')
    .isArray({ min: 1 }).withMessage('Records must be a non-empty array'),
  body('records.*.studentId')
    .isInt().withMessage('Student ID must be an integer'),
  body('records.*.status')
    .trim().isIn(['present', 'absent', 'late', 'leave']).withMessage('Status must be present, absent, late, or leave'),
  body('records.*.remarks')
    .optional({ nullable: true }).trim()
];

const correctAttendanceRules = [
  body('status')
    .trim().isIn(['present', 'absent', 'late', 'leave']).withMessage('Status must be present, absent, late, or leave'),
  body('correctionReason')
    .trim().notEmpty().withMessage('Correction reason is mandatory')
    .isLength({ min: 5 }).withMessage('Correction reason must be at least 5 characters long')
];

module.exports = {
  submitAttendanceRules,
  correctAttendanceRules
};
