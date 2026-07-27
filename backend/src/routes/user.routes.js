const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorizeRoles');

const uploadProfileImage = require('../utils/upload');

router.use(authenticate);

router.get('/profile', userController.getMyProfile);
router.put('/profile', uploadProfileImage.single('profile_image'), userController.updateMyProfile);

// Parent specific paths
router.get('/children', authorizeRoles('parent'), userController.getMyChildren);
router.get('/children/:childStudentId', authorizeRoles('parent'), userController.getChildDetails);

module.exports = router;
