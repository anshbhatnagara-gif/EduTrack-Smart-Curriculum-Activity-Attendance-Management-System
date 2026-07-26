const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

router.use(authenticate);

router.get('/profile', userController.getMyProfile);

// Parent specific paths
router.get('/children', authorizeRoles('parent'), userController.getMyChildren);
router.get('/children/:childStudentId', authorizeRoles('parent'), userController.getChildDetails);

module.exports = router;
