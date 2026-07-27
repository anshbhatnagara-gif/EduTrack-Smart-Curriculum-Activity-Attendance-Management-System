const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  
  return ApiResponse.success(res, 200, result, 'Login successful');
});

const getMe = asyncHandler(async (req, res) => {
  const profile = await authService.getUserProfile(req.user.id);
  return ApiResponse.success(res, 200, profile, 'User profile retrieved successfully');
});

const logout = asyncHandler(async (req, res) => {
  // Since JWT is stateless, client deletes it. We just acknowledge.
  return ApiResponse.success(res, 200, {}, 'Logout successful');
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  await authService.changeUserPassword(req.user.id, oldPassword, newPassword);
  
  return ApiResponse.success(res, 200, {}, 'Password changed successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  await authService.forgotPassword(email, ip);
  
  return ApiResponse.success(res, 200, {}, 'If that email address is in our database, we will send you an email to reset your password.');
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyResetOtp(email, otp);
  
  return ApiResponse.success(res, 200, result, 'OTP verified successfully');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  
  return ApiResponse.success(res, 200, {}, 'Password reset successfully');
});

module.exports = {
  login,
  getMe,
  logout,
  changePassword,
  forgotPassword,
  verifyResetOtp,
  resetPassword
};
