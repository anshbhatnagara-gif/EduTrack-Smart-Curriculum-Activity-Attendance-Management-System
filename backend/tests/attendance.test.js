const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

test('Attendance module test suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api`;

  try {
    // 1. Get a token for teacher 1
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher1@edutrack.local',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    await t.test('POST /api/attendance - Prevent duplicate attendance session', async () => {
      // Submit a session that already exists (seeded session 1 matches Date 2026-07-26, lecture 1, math 9, class 1, section 1)
      const res = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          classId: 1,
          sectionId: 1,
          subjectId: 1,
          academicSessionId: 1,
          attendanceDate: '2026-07-26',
          lectureNumber: 1,
          startTime: '09:00',
          endTime: '10:00',
          records: [
            { studentId: 1, status: 'present' }
          ]
        })
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.message, 'Attendance has already been marked for this subject, lecture number and date.');
    });

    await t.test('GET /api/attendance/student/me - Fails for teacher role', async () => {
      const res = await fetch(`${BASE_URL}/attendance/student/me`, { headers });
      // Expect 403 Forbidden as only student is allowed
      assert.strictEqual(res.status, 403);
    });
  } finally {
    server.close();
  }
});
