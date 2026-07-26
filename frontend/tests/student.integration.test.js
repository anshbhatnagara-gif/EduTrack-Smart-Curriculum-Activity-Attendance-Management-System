import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../backend');

// Switch process working directory to backend so dotenv and mysql config read backend/.env
process.chdir(backendDir);
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'Ansh@2007';

import test from 'node:test';
import assert from 'node:assert';

test('Phase F4 Student API Integration Test Suite', async (t) => {
  const { default: app } = await import('../../backend/src/app.js');
  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api`;

  let token = '';

  // Login as Student
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student1@edutrack.local', password: 'password123' })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.strictEqual(loginBody.success, true);
  assert.strictEqual(loginBody.data.user.role, 'student');
  token = loginBody.data.token;

  const headers = { Authorization: `Bearer ${token}` };

  try {
    await t.test('1. Student Profile API', async () => {
      const res = await fetch(`${BASE_URL}/users/profile`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.role, 'student');
    });

    await t.test('2. Student Dashboard API', async () => {
      const res = await fetch(`${BASE_URL}/reports/student-dashboard`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok('overallAttendancePercentage' in body.data);
    });

    await t.test('3. Student Self Attendance API', async () => {
      const res = await fetch(`${BASE_URL}/attendance/student/me`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('4. Study Materials API', async () => {
      const res = await fetch(`${BASE_URL}/materials`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('5. Course Assignments API', async () => {
      const res = await fetch(`${BASE_URL}/assignments`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('6. Student Submissions API', async () => {
      const res = await fetch(`${BASE_URL}/submissions/me`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('7. Student Marks API', async () => {
      const res = await fetch(`${BASE_URL}/marks/student/me`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('8. Student Timetable API', async () => {
      const res = await fetch(`${BASE_URL}/timetable/me`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('9. Student Announcements API', async () => {
      const res = await fetch(`${BASE_URL}/announcements`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('10. Student Notifications API', async () => {
      const res = await fetch(`${BASE_URL}/notifications`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('11. Student Security Role Enforcement (Access Denied to Admin API)', async () => {
      const res = await fetch(`${BASE_URL}/admin/teachers`, { headers });
      assert.strictEqual(res.status, 403);
    });
  } finally {
    server.close();
  }
});
