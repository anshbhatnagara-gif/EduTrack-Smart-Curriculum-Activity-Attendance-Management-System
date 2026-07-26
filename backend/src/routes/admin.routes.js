const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');
const validateRequest = require('../middleware/validateRequest');

const {
  createTeacherRules,
  updateTeacherRules,
  createStudentRules,
  updateStudentRules,
  createParentRules,
  updateParentRules,
  statusRules,
  linkParentStudentRules
} = require('../validators/user.validator');

// Secure all admin routes to Admin role only
router.use(authenticate);
router.use(authorizeRoles('admin'));

// Teachers endpoints
router.get('/teachers', adminController.getTeachers);
router.post('/teachers', createTeacherRules, validateRequest, adminController.createTeacher);
router.get('/teachers/:id', adminController.getTeacherById);
router.put('/teachers/:id', updateTeacherRules, validateRequest, adminController.updateTeacher);
router.patch('/teachers/:id/status', statusRules, validateRequest, adminController.updateTeacherStatus);

// Students endpoints
router.get('/students', adminController.getStudents);
router.post('/students', createStudentRules, validateRequest, adminController.createStudent);
router.get('/students/:id', adminController.getStudentById);
router.put('/students/:id', updateStudentRules, validateRequest, adminController.updateStudent);
router.patch('/students/:id/status', statusRules, validateRequest, adminController.updateStudentStatus);

// Parents endpoints
router.get('/parents', adminController.getParents);
router.post('/parents', createParentRules, validateRequest, adminController.createParent);
router.get('/parents/:id', adminController.getParentById);
router.put('/parents/:id', updateParentRules, validateRequest, adminController.updateParent);
router.patch('/parents/:id/status', statusRules, validateRequest, adminController.updateParentStatus);

// Parent Student linking
router.post('/parents/link', linkParentStudentRules, validateRequest, adminController.linkParentStudent);
router.get('/parents/:parentId/students', adminController.getLinkedStudents);

module.exports = router;
