const { body, param } = require('express-validator');

const createTeacherRules = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('fullName')
    .trim().notEmpty().withMessage('Full name is required'),
  body('phone')
    .trim().notEmpty().withMessage('Phone is required')
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits'),
  body('employeeCode')
    .trim().notEmpty().withMessage('Employee code is required'),
  body('qualification')
    .trim().notEmpty().withMessage('Qualification is required'),
  body('joiningDate')
    .trim().notEmpty().withMessage('Joining date is required')
    .isISO8601().toDate().withMessage('Invalid joining date format (YYYY-MM-DD)')
];

const updateTeacherRules = [
  body('fullName')
    .optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('phone')
    .optional().trim().notEmpty().withMessage('Phone cannot be empty')
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits'),
  body('qualification')
    .optional().trim().notEmpty().withMessage('Qualification cannot be empty'),
  body('joiningDate')
    .optional().trim().notEmpty().withMessage('Joining date cannot be empty')
    .isISO8601().toDate().withMessage('Invalid date format')
];

const createStudentRules = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('fullName')
    .trim().notEmpty().withMessage('Full name is required'),
  body('phone')
    .trim().notEmpty().withMessage('Phone is required')
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits'),
  body('admissionNumber')
    .trim().notEmpty().withMessage('Admission number is required'),
  body('rollNumber')
    .optional().trim(),
  body('dateOfBirth')
    .trim().notEmpty().withMessage('Date of birth is required')
    .isISO8601().toDate().withMessage('Invalid date of birth (YYYY-MM-DD)'),
  body('gender')
    .trim().notEmpty().withMessage('Gender is required'),
  body('admissionDate')
    .trim().notEmpty().withMessage('Admission date is required')
    .isISO8601().toDate().withMessage('Invalid admission date (YYYY-MM-DD)')
];

const updateStudentRules = [
  body('fullName')
    .optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('phone')
    .optional().trim().notEmpty().withMessage('Phone cannot be empty')
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits'),
  body('rollNumber')
    .optional().trim(),
  body('dateOfBirth')
    .optional().trim().isISO8601().toDate().withMessage('Invalid date format'),
  body('gender')
    .optional().trim().notEmpty().withMessage('Gender cannot be empty'),
  body('admissionDate')
    .optional().trim().isISO8601().toDate().withMessage('Invalid date format')
];

const createParentRules = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('fullName')
    .trim().notEmpty().withMessage('Full name is required'),
  body('phone')
    .trim().notEmpty().withMessage('Phone is required')
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits'),
  body('occupation')
    .trim().notEmpty().withMessage('Occupation is required'),
  body('relationshipType')
    .trim().notEmpty().withMessage('Relationship type is required')
];

const updateParentRules = [
  body('fullName')
    .optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('phone')
    .optional().trim().notEmpty().withMessage('Phone cannot be empty')
    .isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10 and 15 digits'),
  body('occupation')
    .optional().trim().notEmpty().withMessage('Occupation cannot be empty'),
  body('relationshipType')
    .optional().trim().notEmpty().withMessage('Relationship type cannot be empty')
];

const statusRules = [
  body('status')
    .trim().notEmpty().withMessage('Status is required')
    .isIn(['active', 'blocked', 'inactive']).withMessage('Invalid status value')
];

const linkParentStudentRules = [
  body('parentId')
    .isInt().withMessage('Parent ID must be an integer'),
  body('studentId')
    .isInt().withMessage('Student ID must be an integer'),
  body('relationship')
    .trim().notEmpty().withMessage('Relationship is required'),
  body('isPrimary')
    .optional().isBoolean().withMessage('isPrimary must be a boolean')
];

module.exports = {
  createTeacherRules,
  updateTeacherRules,
  createStudentRules,
  updateStudentRules,
  createParentRules,
  updateParentRules,
  statusRules,
  linkParentStudentRules
};
