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

test('Phase F3 Teacher API Integration Test Suite', async (t) => {
  const { default: app } = await import('../../backend/src/app.js');
  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://localhost:${port}/api`;

  // Authenticate first before subtests using seeded teacher credentials
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher1@edutrack.local', password: 'password123' })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.strictEqual(loginBody.success, true);
  const token = loginBody.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  let teacherClassId = null;
  let teacherSectionId = null;
  let teacherSubjectId = null;
  let academicSessionId = 1;

  try {
    await t.test('1. Teacher Authentication Check', async () => {
      assert.ok(token);
      assert.strictEqual(loginBody.data.user.role, 'teacher');
    });

    await t.test('2. Teacher Dashboard API', async () => {
      const res = await fetch(`${BASE_URL}/reports/teacher-dashboard`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.assignedClasses));
      assert.ok(Array.isArray(body.data.todayTimetable));
    });

    await t.test('3. Teacher Assigned Classes API', async () => {
      const res = await fetch(`${BASE_URL}/attendance/assignments`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      if (body.data && body.data.length > 0) {
        teacherClassId = body.data[0].class_id;
        teacherSectionId = body.data[0].section_id;
        teacherSubjectId = body.data[0].subject_id;
        if (body.data[0].academic_session_id) {
          academicSessionId = body.data[0].academic_session_id;
        }
      }
    });

    await t.test('4. Fetch Roster for Manual Attendance', async () => {
      if (!teacherClassId) return;
      const res = await fetch(`${BASE_URL}/attendance/students?classId=${teacherClassId}&sectionId=${teacherSectionId}`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
    });

    await t.test('5. Submit Manual Attendance & Duplicate Rejection', async () => {
      if (!teacherClassId) return;

      const testDate = new Date().toISOString().split('T')[0];
      const lectureNo = Math.floor(Math.random() * 9000) + 1000; // Unique lecture number for test run

      const payload = {
        classId: teacherClassId,
        sectionId: teacherSectionId,
        subjectId: teacherSubjectId,
        academicSessionId: academicSessionId,
        attendanceDate: testDate,
        lectureNumber: lectureNo,
        startTime: '11:00:00',
        endTime: '12:00:00',
        records: [
          { studentId: 1, status: 'present', remarks: 'Good' }
        ]
      };

      // First Submission - Should Succeed
      const res1 = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res1.status, 201);

      // Second Submission (Duplicate) - Should Reject with 400
      const res2 = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res2.status, 400);
    });

    await t.test('6. Attendance History API', async () => {
      const res = await fetch(`${BASE_URL}/attendance/sessions`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('7. Study Materials API', async () => {
      const res = await fetch(`${BASE_URL}/materials`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('8. Assignments API', async () => {
      const res = await fetch(`${BASE_URL}/assignments`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('9. Teacher Timetable API', async () => {
      const res = await fetch(`${BASE_URL}/timetable/me`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    await t.test('10. Teacher Announcements API', async () => {
      const res = await fetch(`${BASE_URL}/announcements`, { headers });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });
  } finally {
    server.close();
  }
});
