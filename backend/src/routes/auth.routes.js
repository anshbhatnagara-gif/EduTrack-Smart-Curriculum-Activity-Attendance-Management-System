const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');
const { loginRules, changePasswordRules } = require('../validators/auth.validator');

router.post('/login', loginRules, validateRequest, authController.login);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.put('/change-password', authenticate, changePasswordRules, validateRequest, authController.changePassword);

module.exports = router;
