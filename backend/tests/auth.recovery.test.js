process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/config/database');
const mailer = require('../src/utils/mailer');

test('Password Recovery Flow', async (t) => {
  let capturedOtp = '';
  let resetToken = '';

  // Mock sendMail
  const originalSendMail = mailer.sendMail;
  mailer.sendMail = async (to, subject, text) => {
    console.log('--- TEST MOCK sendMail CALLED ---');
    console.log('text:', text);
    const match = text.match(/OTP is: (\d{6})/);
    if (match) {
      capturedOtp = match[1];
    }
    return { messageId: 'mock-id' };
  };

  await t.test('POST /api/auth/forgot-password with valid email', async () => {
    const admin = await query('SELECT id FROM users WHERE email = "admin@edutrack.local"');
    await query('DELETE FROM password_reset_otps WHERE user_id = ?', [admin[0].id]);
    
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'admin@edutrack.local' });
      
    assert.strictEqual(res.statusCode, 200);
    assert.ok(capturedOtp.length === 6, 'OTP was captured from email text');
  });

  await t.test('POST /api/auth/verify-reset-otp with valid OTP', async () => {
    const res = await request(app)
      .post('/api/auth/verify-reset-otp')
      .send({ email: 'admin@edutrack.local', otp: capturedOtp });
      
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.data.resetToken, 'Returns a reset token');
    resetToken = res.body.data.resetToken;
  });

  await t.test('POST /api/auth/reset-password with valid token', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'newAdminPassword123' });
      
    assert.strictEqual(res.statusCode, 200);
  });
  
  await t.test('Login with new password works', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@edutrack.local', password: 'newAdminPassword123' });
      
    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.data.token, 'Login successful');
  });
  
  await t.test('Cleanup: restore old password', async () => {
    // We just reset it back to original using DB to bypass cooldown and OTP stuff
    const admin = await query('SELECT id FROM users WHERE email = "admin@edutrack.local"');
    const salt = await require('bcryptjs').genSalt(10);
    const hash = await require('bcryptjs').hash('adminPassword123', salt);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, admin[0].id]);
    
    // Restore original mailer
    mailer.sendMail = originalSendMail;
  });
});
