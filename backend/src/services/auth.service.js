const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const mailer = require('../utils/mailer');

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

const updateUserProfile = async (userId, userRole, data, file) => {
  if (userRole !== 'admin' && userRole !== 'teacher') {
    throw new ApiError(403, 'Access denied. Profile editing is restricted to Admin and Teacher roles.');
  }

  const updates = [];
  const values = [];

  if (data.full_name !== undefined && data.full_name.trim() !== '') {
    updates.push('full_name = ?');
    values.push(data.full_name.trim());
  }

  if (data.phone !== undefined) {
    updates.push('phone = ?');
    values.push(data.phone.trim());
  }

  if (file) {
    const profileImagePath = `/uploads/profiles/${file.filename}`;
    updates.push('profile_image = ?');
    values.push(profileImagePath);
  }

  if (updates.length > 0) {
    updates.push('updated_at = NOW()');
    values.push(userId);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  if (userRole === 'teacher') {
    const teacherUpdates = [];
    const teacherValues = [];

    if (data.qualification !== undefined) {
      teacherUpdates.push('qualification = ?');
      teacherValues.push(data.qualification);
    }
    if (data.experience_years !== undefined) {
      teacherUpdates.push('experience_years = ?');
      teacherValues.push(data.experience_years);
    }
    if (data.specialization !== undefined) {
      teacherUpdates.push('specialization = ?');
      teacherValues.push(data.specialization);
    }

    if (teacherUpdates.length > 0) {
      teacherValues.push(userId);
      await query(`UPDATE teachers SET ${teacherUpdates.join(', ')} WHERE user_id = ?`, teacherValues);
    }
  }

  return await getUserProfile(userId);
};

const forgotPassword = async (email, ip) => {
  // Always delay slightly to prevent timing attacks determining if email exists
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const users = await query('SELECT id, full_name FROM users WHERE email = ? AND status = "active"', [email]);
  if (users.length === 0) {
    // DO NOT reveal that the email does not exist
    return;
  }
  
  const user = users[0];
  
  // Check for recent OTP requests (cooldown 60s)
  const recent = await query(
    'SELECT created_at FROM password_reset_otps WHERE user_id = ? AND created_at > (NOW() - INTERVAL 1 MINUTE) ORDER BY created_at DESC LIMIT 1',
    [user.id]
  );
  if (recent.length > 0) {
    throw new ApiError(429, 'Please wait 60 seconds before requesting a new OTP.');
  }
  
  // Invalidate previous unused OTPs
  await query('UPDATE password_reset_otps SET is_used = 1 WHERE user_id = ? AND is_used = 0', [user.id]);
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);
  
  // Store OTP
  await query(
    'INSERT INTO password_reset_otps (user_id, otp_hash, expires_at, requested_ip) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), ?)',
    [user.id, otpHash, ip]
  );
  
  // Send Email
  const text = `Hello ${user.full_name},\n\nYour password reset OTP is: ${otp}\nThis OTP is valid for 10 minutes.\nIf you did not request this, please ignore this email.`;
  await mailer.sendMail(email, 'EduTrack Password Reset OTP', text);
};

const verifyResetOtp = async (email, otp) => {
  const users = await query('SELECT id, email, role FROM users WHERE email = ? AND status = "active"', [email]);
  if (users.length === 0) {
    throw new ApiError(400, 'Invalid or expired OTP.');
  }
  const user = users[0];
  
  const otps = await query(
    'SELECT id, otp_hash, attempt_count, max_attempts, expires_at FROM password_reset_otps WHERE user_id = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
    [user.id]
  );
  
  if (otps.length === 0) {
    throw new ApiError(400, 'Invalid or expired OTP.');
  }
  const otpRecord = otps[0];
  
  if (new Date() > new Date(otpRecord.expires_at)) {
    throw new ApiError(400, 'OTP has expired.');
  }
  
  if (otpRecord.attempt_count >= otpRecord.max_attempts) {
    await query('UPDATE password_reset_otps SET is_used = 1 WHERE id = ?', [otpRecord.id]);
    throw new ApiError(400, 'Maximum attempts exceeded. Please request a new OTP.');
  }
  
  const isMatch = await bcrypt.compare(otp, otpRecord.otp_hash);
  if (!isMatch) {
    await query('UPDATE password_reset_otps SET attempt_count = attempt_count + 1 WHERE id = ?', [otpRecord.id]);
    throw new ApiError(400, 'Invalid OTP.');
  }
  
  // Mark OTP as used
  await query('UPDATE password_reset_otps SET is_used = 1, used_at = NOW() WHERE id = ?', [otpRecord.id]);
  
  // Generate short-lived reset token (purpose: password-reset)
  const token = generateToken(user, 'password-reset', '15m');
  return { resetToken: token };
};

const resetPassword = async (token, newPassword) => {
  let decoded;
  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_edutrack_2026_dev';
    decoded = jwt.verify(token, secret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired reset token.');
  }
  
  if (!decoded.purpose || decoded.purpose !== 'password-reset') {
    throw new ApiError(401, 'Invalid token purpose.');
  }
  
  const users = await query('SELECT id FROM users WHERE id = ? AND status = "active"', [decoded.id]);
  if (users.length === 0) {
    throw new ApiError(404, 'User not found.');
  }
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, decoded.id]);
  
  // Invalidate any other active OTPs
  await query('UPDATE password_reset_otps SET is_used = 1 WHERE user_id = ? AND is_used = 0', [decoded.id]);
};

module.exports = {
  loginUser,
  getUserProfile,
  changeUserPassword,
  updateUserProfile,
  forgotPassword,
  verifyResetOtp,
  resetPassword
};
