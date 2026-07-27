process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/config/database');

test('Audit Logs Role-Based Access Control', async (t) => {
  let adminToken;
  let teacherToken;
  let studentToken;

  // Login Admin (try adminPassword123 first, fallback password123)
  let adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@edutrack.local', password: 'adminPassword123' });
  if (adminLogin.statusCode !== 200) {
    adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@edutrack.local', password: 'password123' });
  }
  adminToken = adminLogin.body.data.token;

  // Login Teacher
  const teacherLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'teacher1@edutrack.local', password: 'password123' });
  teacherToken = teacherLogin.body.data.token;

  // Login Student
  const studentLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student1@edutrack.local', password: 'password123' });
  studentToken = studentLogin.body.data.token;

  // Seed sample audit log
  const adminUser = await query('SELECT id FROM users WHERE email = "admin@edutrack.local"');
  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, created_at)
     VALUES (?, 'TEST_ACTION', 'TEST_ENTITY', 1, NOW())`,
    [adminUser[0].id]
  );

  await t.test('Admin can fetch audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.logs));
  });

  await t.test('Teacher can fetch audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${teacherToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.logs));
  });

  await t.test('Student is denied access to audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(res.body.success, false);
  });
});
