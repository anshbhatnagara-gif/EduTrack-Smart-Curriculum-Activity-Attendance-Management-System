const jwt = require('jsonwebtoken');

const generateToken = (user, purpose = 'auth', customExpiresIn = null) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    purpose
  };

  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_edutrack_2026_dev';
  const expiresIn = customExpiresIn || process.env.JWT_EXPIRES_IN || '1d';

  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = generateToken;
