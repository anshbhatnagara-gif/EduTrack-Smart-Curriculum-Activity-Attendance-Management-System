import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../../backend');

// Switch process working directory to backend so dotenv and mysql config read backend/.env
process.chdir(backendDir);
process.env.DB_PASSWORD = 'Ansh@2007';

import test from 'node:test';
import assert from 'node:assert';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@edutrack.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

test('Phase F1 Frontend Integration Test Suite', async (t) => {
  const { default: app } = await import('../../backend/src/app.js');
  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api`;

  let token = '';

  try {
    await t.test('1. System Health Check', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('2. Admin Login Verification', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.role, 'admin');

      token = body.data.token;
    });

    await t.test('3. Invalid Login Error Handling', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: 'wrongPassword' })
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Invalid email or password.');
    });

    await t.test('4. Session Restoration via GET /api/auth/me', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.email, ADMIN_EMAIL);
    });

    await t.test('5. Change Password Validation & Revert', async () => {
      const tempPass = 'tempSecurePass123';
      const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword: ADMIN_PASSWORD, newPassword: tempPass })
      });
      assert.strictEqual(changeRes.status, 200);

      // Revert back
      const revertRes = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword: tempPass, newPassword: ADMIN_PASSWORD })
      });
      assert.strictEqual(revertRes.status, 200);
    });

    await t.test('6. Logout Endpoint', async () => {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });
  } finally {
    server.close();
  }
});
