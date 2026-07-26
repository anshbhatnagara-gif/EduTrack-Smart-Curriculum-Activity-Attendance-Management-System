import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../backend');

// Switch process working directory to backend so dotenv reads backend/.env
process.chdir(backendDir);
process.env.DB_PASSWORD = 'Ansh@2007';

import test from 'node:test';
import assert from 'node:assert';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@edutrack.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

test('Phase F2 Admin API Integration Test Suite', async (t) => {
  const { default: app } = await import('../../backend/src/app.js');
  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api`;

  let token = '';

  try {
    await t.test('1. Admin Authentication', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      token = body.data.token;
    });

    const headers = { Authorization: `Bearer ${token}` };

    await t.test('2. Admin Dashboard Stats Endpoint', async () => {
      const res = await fetch(`${BASE_URL}/reports/admin-dashboard`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.counts);
      assert.ok(body.data.todayAttendance);
    });

    await t.test('3. Teachers Management Endpoint', async () => {
      const res = await fetch(`${BASE_URL}/admin/teachers`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    await t.test('4. Students Management Endpoint', async () => {
      const res = await fetch(`${BASE_URL}/admin/students`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    await t.test('5. Parents Management Endpoint', async () => {
      const res = await fetch(`${BASE_URL}/admin/parents`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    await t.test('6. Academic Sessions Endpoint', async () => {
      const res = await fetch(`${BASE_URL}/academic/sessions`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('7. Classes & Sections Endpoints', async () => {
      const cRes = await fetch(`${BASE_URL}/academic/classes`, { headers });
      assert.strictEqual(cRes.status, 200);
      const cBody = await cRes.json();
      assert.strictEqual(cBody.success, true);

      if (cBody.data && cBody.data.length > 0) {
        const classId = cBody.data[0].id;
        const sRes = await fetch(`${BASE_URL}/academic/sections?classId=${classId}`, { headers });
        assert.strictEqual(sRes.status, 200);
      }
    });

    await t.test('8. Subjects Catalog Endpoint', async () => {
      const res = await fetch(`${BASE_URL}/academic/subjects`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('9. Teacher Assignments & Enrollments Endpoints', async () => {
      const aRes = await fetch(`${BASE_URL}/academic/assignments`, { headers });
      assert.strictEqual(aRes.status, 200);

      const eRes = await fetch(`${BASE_URL}/academic/enrollments`, { headers });
      assert.strictEqual(eRes.status, 200);
    });
  } finally {
    server.close();
  }
});
