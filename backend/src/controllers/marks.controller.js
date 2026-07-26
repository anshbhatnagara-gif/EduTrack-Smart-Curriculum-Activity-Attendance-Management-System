const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const calculateGrade = require('../utils/calculateGrade');
const { createNotification } = require('../services/notification.service');

// --- EXAMS ---

const createExam = asyncHandler(async (req, res) => {
  const { name, examType, academicSessionId, startDate, endDate, status } = req.body;
  if (!name || !examType || !academicSessionId || !startDate || !endDate) {
    throw new ApiError(400, 'name, examType, academicSessionId, startDate, and endDate are required.');
  }

  const result = await query(
    `INSERT INTO exams (name, exam_type, academic_session_id, start_date, end_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, examType, academicSessionId, startDate, endDate, status || 'scheduled']
  );

  return ApiResponse.success(res, 201, { id: result.insertId, name, examType }, 'Exam created successfully.');
});

const getExams = asyncHandler(async (req, res) => {
  const sessionId = req.query.academicSessionId || null;
  let sql = 'SELECT * FROM exams';
  const params = [];
  if (sessionId) {
    sql += ' WHERE academic_session_id = ?';
    params.push(sessionId);
  }
  sql += ' ORDER BY start_date DESC';
  const results = await query(sql, params);
  return ApiResponse.success(res, 200, results, 'Exams retrieved successfully.');
});

// --- MARKS ---

const addMarks = asyncHandler(async (req, res) => {
  const { examId, studentId, classId, sectionId, subjectId, maximumMarks, marksObtained, remarks } = req.body;

  if (!examId || !studentId || !classId || !sectionId || !subjectId || maximumMarks === undefined || marksObtained === undefined) {
    throw new ApiError(400, 'examId, studentId, classId, sectionId, subjectId, maximumMarks, and marksObtained are required.');
  }

  const max = parseFloat(maximumMarks);
  const obt = parseFloat(marksObtained);

  if (obt < 0 || obt > max) {
    throw new ApiError(400, `Marks obtained (${obt}) must be between 0 and maximum marks (${max}).`);
  }

  // Teacher validation
  let teacherId = 1;
  if (req.user.role === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teachers.length === 0) throw new ApiError(403, 'Teacher record not found.');
    teacherId = teachers[0].id;

    // Check teacher assignment
    const ass = await query(
      `SELECT id FROM teacher_assignments
       WHERE teacher_id = ? AND class_id = ? AND section_id = ? AND subject_id = ?`,
      [teacherId, classId, sectionId, subjectId]
    );
    if (ass.length === 0) {
      throw new ApiError(403, 'You are not assigned to record marks for this class and subject.');
    }
  } else {
    // Admin bypass: lookup assigned teacher
    const ass = await query('SELECT teacher_id FROM teacher_assignments WHERE class_id = ? AND section_id = ? AND subject_id = ?', [classId, sectionId, subjectId]);
    teacherId = ass.length > 0 ? ass[0].teacher_id : 1;
  }

  // Check unique constraint
  const dup = await query(
    'SELECT id FROM marks WHERE exam_id = ? AND student_id = ? AND subject_id = ?',
    [examId, studentId, subjectId]
  );
  if (dup.length > 0) {
    throw new ApiError(400, 'Marks have already been entered for this student, exam and subject.');
  }

  const grade = calculateGrade(obt, max);

  const result = await query(
    `INSERT INTO marks (exam_id, student_id, class_id, section_id, subject_id, teacher_id, maximum_marks, marks_obtained, grade, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [examId, studentId, classId, sectionId, subjectId, teacherId, max, obt, grade, remarks || null]
  );

  // Send Notification
  const stud = await query('SELECT u.id as user_id, u.full_name FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?', [studentId]);
  const exam = await query('SELECT name FROM exams WHERE id = ?', [examId]);
  const subject = await query('SELECT name FROM subjects WHERE id = ?', [subjectId]);

  if (stud.length > 0) {
    const studentUser = stud[0];
    const examName = exam[0]?.name || 'Exam';
    const subName = subject[0]?.name || 'Subject';

    await createNotification(
      studentUser.user_id,
      'Marks Published',
      `Your marks for ${subName} in "${examName}" have been published: ${obt}/${max} (Grade: ${grade}).`,
      'marks_published',
      'exams',
      examId
    );

    // Notify parents
    const parents = await query(
      'SELECT p.user_id FROM parents p JOIN parent_student_links l ON p.id = l.parent_id WHERE l.student_id = ?',
      [studentId]
    );
    for (const parent of parents) {
      await createNotification(
        parent.user_id,
        'Child Marks Published',
        `Your child ${studentUser.full_name}'s marks for ${subName} in "${examName}" have been published: ${obt}/${max} (Grade: ${grade}).`,
        'marks_published',
        'students',
        studentId
      );
    }
  }

  return ApiResponse.success(res, 201, { id: result.insertId, grade }, 'Marks recorded successfully.');
});

const updateMarks = asyncHandler(async (req, res) => {
  const { marksObtained, remarks } = req.body;
  if (marksObtained === undefined) {
    throw new ApiError(400, 'marksObtained is required to update marks.');
  }

  const markRows = await query('SELECT * FROM marks WHERE id = ?', [req.params.id]);
  if (markRows.length === 0) {
    throw new ApiError(404, 'Marks record not found.');
  }
  const mark = markRows[0];

  // Teacher check
  if (req.user.role === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teachers.length === 0 || teachers[0].id !== mark.teacher_id) {
      throw new ApiError(403, 'Access denied. You can only edit marks recorded by you.');
    }
  }

  const max = parseFloat(mark.maximum_marks);
  const obt = parseFloat(marksObtained);

  if (obt < 0 || obt > max) {
    throw new ApiError(400, `Marks obtained (${obt}) must be between 0 and maximum marks (${max}).`);
  }

  const grade = calculateGrade(obt, max);

  await query(
    `UPDATE marks
     SET marks_obtained = ?, grade = ?, remarks = ?
     WHERE id = ?`,
    [obt, grade, remarks || null, req.params.id]
  );

  return ApiResponse.success(res, 200, { id: req.params.id, marksObtained: obt, grade }, 'Marks updated successfully.');
});

const getMyMarks = asyncHandler(async (req, res) => {
  const studentRows = await query('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
  if (studentRows.length === 0) throw new ApiError(404, 'Student profile record not found.');
  const studentId = studentRows[0].id;

  const results = await query(
    `SELECT m.*, e.name as exam_name, s.name as subject_name, s.subject_code
     FROM marks m
     JOIN exams e ON m.exam_id = e.id
     JOIN subjects s ON m.subject_id = s.id
     WHERE m.student_id = ?
     ORDER BY e.start_date DESC`,
    [studentId]
  );

  return ApiResponse.success(res, 200, results, 'Marks retrieved successfully.');
});

const getStudentMarks = asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);

  // Parent ownership validation
  if (req.user.role === 'parent') {
    const parentRows = await query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parentRows.length === 0) throw new ApiError(404, 'Parent record not found.');
    const parentId = parentRows[0].id;

    const link = await query(
      'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );
    if (link.length === 0) {
      throw new ApiError(403, 'Access denied. You are not linked to this student.');
    }
  }

  const results = await query(
    `SELECT m.*, e.name as exam_name, s.name as subject_name, s.subject_code
     FROM marks m
     JOIN exams e ON m.exam_id = e.id
     JOIN subjects s ON m.subject_id = s.id
     WHERE m.student_id = ?
     ORDER BY e.start_date DESC`,
    [studentId]
  );

  return ApiResponse.success(res, 200, results, 'Student marks retrieved successfully.');
});

const getClassMarks = asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.classId, 10);
  const examId = req.query.examId ? parseInt(req.query.examId, 10) : null;
  const subjectId = req.query.subjectId ? parseInt(req.query.subjectId, 10) : null;

  let sql = `
    SELECT m.*, u.full_name as student_name, s.admission_number, e.name as exam_name, sub.name as subject_name
    FROM marks m
    JOIN students s ON m.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN exams e ON m.exam_id = e.id
    JOIN subjects sub ON m.subject_id = sub.id
    WHERE m.class_id = ?
  `;
  const params = [classId];

  if (examId) { sql += ' AND m.exam_id = ?'; params.push(examId); }
  if (subjectId) { sql += ' AND m.subject_id = ?'; params.push(subjectId); }

  const results = await query(sql, params);
  return ApiResponse.success(res, 200, results, 'Class marks retrieved successfully.');
});

// Performance report
const getStudentPerformanceReport = asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);

  // Validate parent linked
  if (req.user.role === 'parent') {
    const parentRows = await query('SELECT id FROM parents WHERE user_id = ?', [req.user.id]);
    if (parentRows.length === 0) throw new ApiError(404, 'Parent record not found.');
    const parentId = parentRows[0].id;

    const link = await query(
      'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?',
      [parentId, studentId]
    );
    if (link.length === 0) {
      throw new ApiError(403, 'Access denied. You are not linked to this student.');
    }
  }

  // Retrieve marks
  const marksList = await query(
    `SELECT m.*, sub.name as subject_name, sub.subject_code
     FROM marks m
     JOIN subjects sub ON m.subject_id = sub.id
     WHERE m.student_id = ?`,
    [studentId]
  );

  if (marksList.length === 0) {
    return ApiResponse.success(res, 200, {
      message: 'No marks recorded for this student yet.',
      report: null
    });
  }

  let totalMaxMarks = 0;
  let totalObtained = 0;
  let highestMark = -1;
  let lowestMark = 999999;
  let highestSubject = '';
  let lowestSubject = '';

  const subjectMarks = marksList.map(m => {
    const max = parseFloat(m.maximum_marks);
    const obt = parseFloat(m.marks_obtained);
    totalMaxMarks += max;
    totalObtained += obt;

    if (obt > highestMark) {
      highestMark = obt;
      highestSubject = m.subject_name;
    }
    if (obt < lowestMark) {
      lowestMark = obt;
      lowestSubject = m.subject_name;
    }

    return {
      subjectId: m.subject_id,
      subjectName: m.subject_name,
      subjectCode: m.subject_code,
      maximumMarks: max,
      marksObtained: obt,
      grade: m.grade,
      percentage: parseFloat(((obt / max) * 100).toFixed(2))
    };
  });

  const percentage = parseFloat(((totalObtained / totalMaxMarks) * 100).toFixed(2));
  const grade = calculateGrade(totalObtained, totalMaxMarks);
  const average = parseFloat((totalObtained / marksList.length).toFixed(2));

  // Determine risk category dynamically based on rules (need attendance and pending assignments as well)
  // Query attendance percentage
  const attendanceRecords = await query('SELECT status FROM attendance_records WHERE student_id = ?', [studentId]);
  const calculateAttendance = require('../utils/calculateAttendance');
  const attStats = calculateAttendance(attendanceRecords);

  // Query pending assignments
  // Enrolled class
  const enrollment = await query(
    'SELECT class_id, section_id FROM student_enrollments WHERE student_id = ? AND enrollment_status = "active"',
    [studentId]
  );
  let pendingAssignmentsCount = 0;
  if (enrollment.length > 0) {
    const { class_id, section_id } = enrollment[0];
    const totalAssignments = await query(
      'SELECT id FROM assignments WHERE class_id = ? AND section_id = ? AND status = "active"',
      [class_id, section_id]
    );
    const submissions = await query(
      'SELECT assignment_id FROM assignment_submissions WHERE student_id = ?',
      [studentId]
    );
    const submittedIds = submissions.map(s => s.assignment_id);
    const pending = totalAssignments.filter(a => !submittedIds.includes(a.id));
    pendingAssignmentsCount = pending.length;
  }

  // Risk Categorization:
  // GOOD: Attendance >= 85% and Marks >= 70% and No major pending assignments (e.g. pending < 3)
  // AVERAGE: Attendance >= 75% and Marks >= 50%
  // NEEDS_ATTENTION: Attendance below 75% or marks below 50% or 3 or more pending assignments
  // AT_RISK: Attendance below 60% or marks below 40% or 5 or more pending assignments
  let category = 'AVERAGE';
  const reasons = [];

  const marksPct = percentage;
  const attPct = attStats.percentage;

  if (attPct < 60 || marksPct < 40 || pendingAssignmentsCount >= 5) {
    category = 'AT_RISK';
    if (attPct < 60) reasons.push(`Attendance is below 60% (${attPct}%)`);
    if (marksPct < 40) reasons.push(`Overall marks percentage is below 40% (${marksPct}%)`);
    if (pendingAssignmentsCount >= 5) reasons.push(`Has ${pendingAssignmentsCount} pending assignments`);
  } else if (attPct < 75 || marksPct < 50 || pendingAssignmentsCount >= 3) {
    category = 'NEEDS_ATTENTION';
    if (attPct < 75) reasons.push(`Attendance is below 75% (${attPct}%)`);
    if (marksPct < 50) reasons.push(`Overall marks percentage is below 50% (${marksPct}%)`);
    if (pendingAssignmentsCount >= 3) reasons.push(`Has ${pendingAssignmentsCount} pending assignments`);
  } else if (attPct >= 85 && marksPct >= 70 && pendingAssignmentsCount === 0) {
    category = 'GOOD';
  }

  const analysisReport = {
    studentId,
    subjectMarks,
    totalMaximumMarks: totalMaxMarks,
    totalMarksObtained: totalObtained,
    overallPercentage: percentage,
    overallGrade: grade,
    subjectAverage: average,
    highestSubject: { subject: highestSubject, marks: highestMark },
    lowestSubject: { subject: lowestSubject, marks: lowestMark },
    performanceAnalysis: {
      category,
      reasons,
      attendancePercentage: attPct,
      pendingAssignments: pendingAssignmentsCount
    }
  };

  return ApiResponse.success(res, 200, analysisReport, 'Performance report generated successfully.');
});

module.exports = {
  createExam,
  getExams,
  addMarks,
  updateMarks,
  getMyMarks,
  getStudentMarks,
  getClassMarks,
  getStudentPerformanceReport
};
