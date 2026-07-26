const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

test('Authentication API test suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api`;

  try {
    await t.test('POST /api/auth/login - Success with valid Admin credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@edutrack.local',
          password: 'password123'
        })
      });
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.role, 'admin');
    });

    await t.test('POST /api/auth/login - Fails with invalid password', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@edutrack.local',
          password: 'wrongPassword'
        })
      });
      assert.strictEqual(res.status, 401);

      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Invalid email or password.');
    });

    await t.test('GET /api/users/profile - Access blocked without JWT token', async () => {
      const res = await fetch(`${BASE_URL}/users/profile`);
      assert.strictEqual(res.status, 401);

      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Access token is missing or invalid. Please log in.');
    });
  } finally {
    server.close();
  }
});
