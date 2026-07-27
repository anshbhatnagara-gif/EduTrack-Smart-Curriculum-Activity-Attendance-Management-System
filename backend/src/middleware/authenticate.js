const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Access token is missing or invalid. Please log in.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_edutrack_2026_dev');
    
    if (decoded.purpose && decoded.purpose === 'password-reset') {
      throw new ApiError(401, 'Invalid token purpose. Password reset tokens cannot be used for authentication.');
    }

    // Check if user still exists and is active in database
    const users = await query('SELECT id, full_name, email, role, status FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      throw new ApiError(401, 'The user belonging to this token no longer exists.');
    }

    const user = users[0];

    if (user.status !== 'active') {
      throw new ApiError(403, `Your account status is ${user.status}. Access denied. Please contact administration.`);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Your access token has expired. Please log in again.');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token. Authorization denied.');
    }
    throw error;
  }
});

module.exports = authenticate;
