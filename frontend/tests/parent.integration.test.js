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

test('Phase F4 Parent API Integration Test Suite', async (t) => {
  const { default: app } = await import('../../backend/src/app.js');
  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api`;

  let token = '';
  let linkedStudentId = null;

  // Login as Parent
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'parent1@edutrack.local', password: 'password123' })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.strictEqual(loginBody.success, true);
  assert.strictEqual(loginBody.data.user.role, 'parent');
  token = loginBody.data.token;

  const headers = { Authorization: `Bearer ${token}` };

  try {
    await t.test('1. Parent Profile API', async () => {
      const res = await fetch(`${BASE_URL}/users/profile`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.role, 'parent');
    });

    await t.test('2. Fetch Linked Children API', async () => {
      const res = await fetch(`${BASE_URL}/users/children`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      if (body.data.length > 0) {
        linkedStudentId = body.data[0].student_id;
      }
    });

    await t.test('3. Parent Dashboard API', async () => {
      const res = await fetch(`${BASE_URL}/reports/parent-dashboard`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    await t.test('4. Linked Child Attendance API', async () => {
      if (!linkedStudentId) return;
      const res = await fetch(`${BASE_URL}/attendance/student/${linkedStudentId}`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('5. Linked Child Marks API', async () => {
      if (!linkedStudentId) return;
      const res = await fetch(`${BASE_URL}/marks/student/${linkedStudentId}`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('6. Parent Children Timetable API', async () => {
      const res = await fetch(`${BASE_URL}/timetable/me`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('7. Parent Announcements API', async () => {
      const res = await fetch(`${BASE_URL}/announcements`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('8. Parent Notifications API', async () => {
      const res = await fetch(`${BASE_URL}/notifications`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('9. Security Check: Reject Access to Unlinked Student Data (HTTP 403)', async () => {
      const unlinkedStudentId = 99999;
      const res = await fetch(`${BASE_URL}/attendance/student/${unlinkedStudentId}`, { headers });
      assert.strictEqual(res.status, 403);
    });

    await t.test('10. Security Check: Reject Parent Access to Student-Only Write Operations (HTTP 403)', async () => {
      const res = await fetch(`${BASE_URL}/assignments/1/submissions`, {
        method: 'POST',
        headers
      });
      assert.strictEqual(res.status, 403);
    });
  } finally {
    server.close();
  }
});
