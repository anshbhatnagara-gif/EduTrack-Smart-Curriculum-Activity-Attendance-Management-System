process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

test('Report Exports Role-Based Access Control', async (t) => {
  let adminToken;
  let teacherToken;
  let studentToken;

  // Login Admin
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

  await t.test('Admin can export attendance PDF report', async () => {
    const res = await request(app)
      .get('/api/reports/export/attendance?format=pdf')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');
  });

  await t.test('Admin can export attendance Excel report', async () => {
    const res = await request(app)
      .get('/api/reports/export/attendance?format=excel')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('spreadsheetml.sheet'));
  });

  await t.test('Teacher can export attendance PDF report', async () => {
    const res = await request(app)
      .get('/api/reports/export/attendance?format=pdf')
      .set('Authorization', `Bearer ${teacherToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');
  });

  await t.test('Student is denied export access', async () => {
    const res = await request(app)
      .get('/api/reports/export/attendance?format=pdf')
      .set('Authorization', `Bearer ${studentToken}`);

    assert.strictEqual(res.statusCode, 403);
  });
});
