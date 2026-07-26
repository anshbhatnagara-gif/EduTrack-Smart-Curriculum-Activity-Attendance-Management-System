const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');

const loginUser = async (email, password) => {
  // Fetch user including password hash
  const users = await query('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const user = users[0];

  // Check user status
  if (user.status !== 'active') {
    throw new ApiError(403, `Account is ${user.status}. Please contact administration.`);
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  // Update last login timestamp
  await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

  // Generate token
  const token = generateToken(user);

  // Return user without password hash
  const { password_hash, ...userProfile } = user;
  return {
    user: userProfile,
    token
  };
};

const getUserProfile = async (userId) => {
  const users = await query(
    `SELECT id, full_name, email, phone, role, status, profile_image, last_login_at, created_at, updated_at
     FROM users WHERE id = ?`,
    [userId]
  );

  if (users.length === 0) {
    throw new ApiError(404, 'User profile not found.');
  }

  const user = users[0];

  // If user is a student, parent or teacher, retrieve extra info
  if (user.role === 'teacher') {
    const teachers = await query('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
    if (teachers.length > 0) user.teacherInfo = teachers[0];
  } else if (user.role === 'student') {
    const students = await query('SELECT * FROM students WHERE user_id = ?', [user.id]);
    if (students.length > 0) user.studentInfo = students[0];
  } else if (user.role === 'parent') {
    const parents = await query('SELECT * FROM parents WHERE user_id = ?', [user.id]);
    if (parents.length > 0) user.parentInfo = parents[0];
  }

  return user;
};

const changeUserPassword = async (userId, oldPassword, newPassword) => {
  const users = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  if (users.length === 0) {
    throw new ApiError(404, 'User not found.');
  }

  const user = users[0];
  const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isMatch) {
    throw new ApiError(400, 'Incorrect old password.');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  return true;
};

module.exports = {
  loginUser,
  getUserProfile,
  changeUserPassword
};
