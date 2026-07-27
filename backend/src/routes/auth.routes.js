const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');
const { 
  loginRules, 
  changePasswordRules,
  forgotPasswordRules,
  verifyOtpRules,
  resetPasswordRules
} = require('../validators/auth.validator');

router.post('/login', loginRules, validateRequest, authController.login);

router.post('/forgot-password', forgotPasswordRules, validateRequest, authController.forgotPassword);
router.post('/verify-reset-otp', verifyOtpRules, validateRequest, authController.verifyResetOtp);
router.post('/reset-password', resetPasswordRules, validateRequest, authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.put('/change-password', authenticate, changePasswordRules, validateRequest, authController.changePassword);

module.exports = router;
