const { query, getTransaction } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('./notification.service');

// Helper to check if teacher is assigned to class/subject
const verifyTeacherAssignment = async (teacherUserId, classId, sectionId, subjectId) => {
  const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [teacherUserId]);
  if (teacherRows.length === 0) {
    throw new ApiError(403, 'User is not a registered teacher.');
  }
  const teacherId = teacherRows[0].id;

  const ass = await query(
    `SELECT id FROM teacher_assignments
     WHERE teacher_id = ? AND class_id = ? AND section_id = ? AND subject_id = ?`,
    [teacherId, classId, sectionId, subjectId]
  );
  if (ass.length === 0) {
    throw new ApiError(403, 'You are not assigned to this class and subject.');
  }
  return teacherId;
};

// ----------------------------------------------------
// STUDY MATERIALS
// ----------------------------------------------------

const addStudyMaterial = async (user, data) => {
  let teacherId;
  if (user.role === 'teacher') {
    teacherId = await verifyTeacherAssignment(user.id, data.classId, data.sectionId, data.subjectId);
  } else if (user.role === 'admin') {
    // Admin bypass: find assigned teacher or default to first teacher
    const ass = await query('SELECT id FROM teachers LIMIT 1');
    if (ass.length === 0) throw new ApiError(400, 'No teachers registered in system.');
    teacherId = ass[0].id;
  } else {
    throw new ApiError(403, 'Unauthorized.');
  }

  const result = await query(
    `INSERT INTO study_materials (teacher_id, class_id, section_id, subject_id, title, description, material_type, file_path, external_url, unit_name, topic_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      teacherId,
      data.classId,
      data.sectionId || null,
      data.subjectId,
      data.title,
      data.description || null,
      data.materialType,
      data.filePath || null,
      data.externalUrl || null,
      data.unitName,
      data.topicName
    ]
  );
  return { id: result.insertId, ...data };
};

const getStudyMaterials = async (user, filters = {}) => {
  let sql = `
    SELECT sm.*, sub.name as subject_name, sub.subject_code, c.name as class_name, sec.name as section_name, u.full_name as teacher_name
    FROM study_materials sm
    JOIN subjects sub ON sm.subject_id = sub.id
    JOIN classes c ON sm.class_id = c.id
    LEFT JOIN sections sec ON sm.section_id = sec.id
    JOIN teachers t ON sm.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (user.role === 'student') {
    // Retrieve enrolled class/section
    const enrolled = await query(
      `SELECT class_id, section_id FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       WHERE s.user_id = ? AND se.enrollment_status = 'active'`,
      [user.id]
    );
    if (enrolled.length === 0) {
      return []; // Not enrolled in any active class
    }
    const { class_id, section_id } = enrolled[0];
    sql += ' AND sm.class_id = ? AND (sm.section_id = ? OR sm.section_id IS NULL)';
    params.push(class_id, section_id);

  } else if (user.role === 'parent') {
    // Retrieve linked children enrolled classes/sections
    const children = await query(
      `SELECT se.class_id, se.section_id FROM student_enrollments se
       JOIN parent_student_links psl ON se.student_id = psl.student_id
       JOIN parents p ON psl.parent_id = p.id
       WHERE p.user_id = ? AND se.enrollment_status = 'active'`,
      [user.id]
    );
    if (children.length === 0) {
      return [];
    }
    // Match any of child classes
    const conditions = [];
    children.forEach(c => {
      conditions.push('(sm.class_id = ? AND (sm.section_id = ? OR sm.section_id IS NULL))');
      params.push(c.class_id, c.section_id);
    });
    sql += ` AND (${conditions.join(' OR ')})`;

  } else if (user.role === 'teacher') {
    // Filter by assigned classes
    const assignments = await query(
      `SELECT class_id, section_id FROM teacher_assignments ta
       JOIN teachers t ON ta.teacher_id = t.id
       WHERE t.user_id = ?`,
      [user.id]
    );
    if (assignments.length === 0) {
      return [];
    }
    const conditions = [];
    assignments.forEach(a => {
      conditions.push('(sm.class_id = ? AND sm.section_id = ?)');
      params.push(a.class_id, a.section_id);
    });
    sql += ` AND (${conditions.join(' OR ')})`;
  }

  // Extra filter parameters
  if (filters.subjectId) { sql += ' AND sm.subject_id = ?'; params.push(filters.subjectId); }
  if (filters.classId) { sql += ' AND sm.class_id = ?'; params.push(filters.classId); }

  sql += ' ORDER BY sm.published_at DESC';
  return query(sql, params);
};

const getStudyMaterialById = async (id, user) => {
  const rows = await query('SELECT * FROM study_materials WHERE id = ?', [id]);
  if (rows.length === 0) throw new ApiError(404, 'Study material not found.');
  return rows[0];
};

const updateStudyMaterial = async (id, user, data) => {
  const materialRows = await query('SELECT * FROM study_materials WHERE id = ?', [id]);
  if (materialRows.length === 0) throw new ApiError(404, 'Study material not found.');
  const material = materialRows[0];

  // Authorization Check
  if (user.role === 'teacher') {
    const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    if (teacherRows.length === 0 || teacherRows[0].id !== material.teacher_id) {
      throw new ApiError(403, 'Access denied. You can only edit materials created by you.');
    }
  }

  const fields = [];
  const params = [];
  if (data.title) { fields.push('title = ?'); params.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.externalUrl !== undefined) { fields.push('external_url = ?'); params.push(data.externalUrl); }
  if (data.filePath !== undefined) { fields.push('file_path = ?'); params.push(data.filePath); }
  if (data.unitName) { fields.push('unit_name = ?'); params.push(data.unitName); }
  if (data.topicName) { fields.push('topic_name = ?'); params.push(data.topicName); }

  if (fields.length > 0) {
    params.push(id);
    await query(`UPDATE study_materials SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  const updated = await query('SELECT * FROM study_materials WHERE id = ?', [id]);
  return updated[0];
};

const deleteStudyMaterial = async (id, user) => {
  const materialRows = await query('SELECT * FROM study_materials WHERE id = ?', [id]);
  if (materialRows.length === 0) throw new ApiError(404, 'Study material not found.');
  const material = materialRows[0];

  if (user.role === 'teacher') {
    const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    if (teacherRows.length === 0 || teacherRows[0].id !== material.teacher_id) {
      throw new ApiError(403, 'Access denied. You can only delete materials created by you.');
    }
  }

  await query('DELETE FROM study_materials WHERE id = ?', [id]);
  return true;
};

// ----------------------------------------------------
// ASSIGNMENTS & SUBMISSIONS
// ----------------------------------------------------

const createAssignment = async (user, data) => {
  let teacherId;
  if (user.role === 'teacher') {
    teacherId = await verifyTeacherAssignment(user.id, data.classId, data.sectionId, data.subjectId);
  } else {
    // Admin bypass: find assigned teacher or default to first teacher
    const ass = await query('SELECT teacher_id FROM teacher_assignments WHERE class_id = ? AND section_id = ? AND subject_id = ?', [data.classId, data.sectionId, data.subjectId]);
    teacherId = ass.length > 0 ? ass[0].teacher_id : 1;
  }

  const tx = await getTransaction();
  try {
    const result = await tx.execute(
      `INSERT INTO assignments (teacher_id, class_id, section_id, subject_id, title, description, attachment_path, due_date, maximum_marks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        teacherId,
        data.classId,
        data.sectionId,
        data.subjectId,
        data.title,
        data.description || null,
        data.attachmentPath || null,
        data.dueDate,
        data.maximumMarks
      ]
    );
    const assignmentId = result.insertId;

    // Trigger Notification for all enrolled students in the class/section
    const students = await tx.execute(
      `SELECT u.id as user_id FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE se.class_id = ? AND se.section_id = ? AND se.enrollment_status = 'active'`,
      [data.classId, data.sectionId]
    );

    const subjectRows = await tx.execute('SELECT name FROM subjects WHERE id = ?', [data.subjectId]);
    const subjectName = subjectRows[0]?.name || 'Subject';

    for (const stud of students) {
      await createNotification(
        stud.user_id,
        'New Assignment Published',
        `A new assignment "${data.title}" has been published for ${subjectName}. Due: ${data.dueDate}.`,
        'assignment_published',
        'assignments',
        assignmentId
      );
    }

    await tx.commit();
    return { id: assignmentId, ...data };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

const getAssignmentsList = async (user, filters = {}) => {
  let sql = `
    SELECT a.*, sub.name as subject_name, sub.subject_code, c.name as class_name, sec.name as section_name, u.full_name as teacher_name
    FROM assignments a
    JOIN subjects sub ON a.subject_id = sub.id
    JOIN classes c ON a.class_id = c.id
    JOIN sections sec ON a.section_id = sec.id
    JOIN teachers t ON a.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (user.role === 'student') {
    const enrolled = await query(
      `SELECT class_id, section_id FROM student_enrollments se
       JOIN students s ON se.student_id = s.id
       WHERE s.user_id = ? AND se.enrollment_status = 'active'`,
      [user.id]
    );
    if (enrolled.length === 0) return [];
    const { class_id, section_id } = enrolled[0];
    sql += ' AND a.class_id = ? AND a.section_id = ? AND a.status = "active"';
    params.push(class_id, section_id);

  } else if (user.role === 'parent') {
    const children = await query(
      `SELECT se.class_id, se.section_id FROM student_enrollments se
       JOIN parent_student_links psl ON se.student_id = psl.student_id
       JOIN parents p ON psl.parent_id = p.id
       WHERE p.user_id = ? AND se.enrollment_status = 'active'`,
      [user.id]
    );
    if (children.length === 0) return [];
    const conditions = [];
    children.forEach(c => {
      conditions.push('(a.class_id = ? AND a.section_id = ?)');
      params.push(c.class_id, c.section_id);
    });
    sql += ` AND (${conditions.join(' OR ')}) AND a.status = "active"`;

  } else if (user.role === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    if (teachers.length === 0) return [];
    const teacherId = teachers[0].id;
    sql += ' AND a.teacher_id = ?';
    params.push(teacherId);
  }

  if (filters.subjectId) { sql += ' AND a.subject_id = ?'; params.push(filters.subjectId); }

  sql += ' ORDER BY a.created_at DESC';
  return query(sql, params);
};

const getAssignmentById = async (id, user) => {
  const rows = await query(
    `SELECT a.*, sub.name as subject_name, sub.subject_code, c.name as class_name, sec.name as section_name
     FROM assignments a
     JOIN subjects sub ON a.subject_id = sub.id
     JOIN classes c ON a.class_id = c.id
     JOIN sections sec ON a.section_id = sec.id
     WHERE a.id = ?`,
    [id]
  );
  if (rows.length === 0) throw new ApiError(404, 'Assignment not found.');
  return rows[0];
};

const updateAssignment = async (id, user, data) => {
  const assignmentRows = await query('SELECT * FROM assignments WHERE id = ?', [id]);
  if (assignmentRows.length === 0) throw new ApiError(404, 'Assignment not found.');
  const assignment = assignmentRows[0];

  if (user.role === 'teacher') {
    const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    if (teacherRows.length === 0 || teacherRows[0].id !== assignment.teacher_id) {
      throw new ApiError(403, 'Access denied. You can only edit assignments created by you.');
    }
  }

  const fields = [];
  const params = [];
  if (data.title) { fields.push('title = ?'); params.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.attachmentPath !== undefined) { fields.push('attachment_path = ?'); params.push(data.attachmentPath); }
  if (data.dueDate) { fields.push('due_date = ?'); params.push(data.dueDate); }
  if (data.maximumMarks) { fields.push('maximum_marks = ?'); params.push(data.maximumMarks); }
  if (data.status) { fields.push('status = ?'); params.push(data.status); }

  if (fields.length > 0) {
    params.push(id);
    await query(`UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  const updated = await query('SELECT * FROM assignments WHERE id = ?', [id]);
  return updated[0];
};

const deleteAssignment = async (id, user) => {
  const assignmentRows = await query('SELECT * FROM assignments WHERE id = ?', [id]);
  if (assignmentRows.length === 0) throw new ApiError(404, 'Assignment not found.');
  const assignment = assignmentRows[0];

  if (user.role === 'teacher') {
    const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    if (teacherRows.length === 0 || teacherRows[0].id !== assignment.teacher_id) {
      throw new ApiError(403, 'Access denied. You can only delete assignments created by you.');
    }
  }

  await query('DELETE FROM assignments WHERE id = ?', [id]);
  return true;
};

// Submissions
const submitAssignment = async (assignmentId, user, data) => {
  if (user.role !== 'student') throw new ApiError(403, 'Only students can submit assignments.');

  const studentRows = await query('SELECT id, user_id FROM students WHERE user_id = ?', [user.id]);
  if (studentRows.length === 0) throw new ApiError(404, 'Student record not found.');
  const studentId = studentRows[0].id;

  const assignmentRows = await query('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
  if (assignmentRows.length === 0) throw new ApiError(404, 'Assignment not found.');
  const assignment = assignmentRows[0];

  // Check enrollment
  const enrollment = await query(
    'SELECT id FROM student_enrollments WHERE student_id = ? AND class_id = ? AND section_id = ? AND enrollment_status = "active"',
    [studentId, assignment.class_id, assignment.section_id]
  );
  if (enrollment.length === 0) {
    throw new ApiError(403, 'You are not enrolled in the class/section of this assignment.');
  }

  // Calculate status
  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  const status = now > dueDate ? 'late' : 'submitted';

  // Check duplicate submission
  const existing = await query(
    'SELECT id, submission_status FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
    [assignmentId, studentId]
  );

  if (existing.length > 0) {
    // If evaluated, prevent updates
    if (existing[0].submission_status === 'evaluated') {
      throw new ApiError(400, 'Your submission has already been evaluated and cannot be changed.');
    }

    // Check if deadline passed
    if (now > dueDate) {
      throw new ApiError(400, 'Submission deadline has passed. You cannot modify your submission.');
    }

    // Update
    await query(
      `UPDATE assignment_submissions
       SET submission_text = ?, file_path = ?, submitted_at = NOW(), submission_status = ?
       WHERE id = ?`,
      [data.submissionText || null, data.filePath || null, status, existing[0].id]
    );
    return { submissionId: existing[0].id, updated: true };
  } else {
    // Create new
    const result = await query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_path, submission_status)
       VALUES (?, ?, ?, ?, ?)`,
      [assignmentId, studentId, data.submissionText || null, data.filePath || null, status]
    );
    return { submissionId: result.insertId, updated: false };
  }
};

const getSubmissionsForAssignment = async (assignmentId, user) => {
  const assignmentRows = await query('SELECT teacher_id FROM assignments WHERE id = ?', [assignmentId]);
  if (assignmentRows.length === 0) throw new ApiError(404, 'Assignment not found.');
  const assignment = assignmentRows[0];

  if (user.role === 'teacher') {
    const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
    if (teacherRows.length === 0 || teacherRows[0].id !== assignment.teacher_id) {
      throw new ApiError(403, 'Access denied. You can only view submissions for assignments you created.');
    }
  }

  const sql = `
    SELECT sub.*, u.full_name as student_name, s.admission_number, se.roll_number
    FROM assignment_submissions sub
    JOIN students s ON sub.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN student_enrollments se ON s.id = se.student_id AND se.enrollment_status = 'active'
    WHERE sub.assignment_id = ?
    ORDER BY CAST(se.roll_number AS UNSIGNED) ASC
  `;
  return query(sql, [assignmentId]);
};

const evaluateSubmission = async (submissionId, teacherUser, data) => {
  if (teacherUser.role !== 'teacher' && teacherUser.role !== 'admin') {
    throw new ApiError(403, 'Only teachers or admins can evaluate submissions.');
  }

  // Get submission
  const submissions = await query(
    `SELECT sub.*, a.maximum_marks, a.title as assignment_title, s.user_id as student_user_id, a.teacher_id
     FROM assignment_submissions sub
     JOIN assignments a ON sub.assignment_id = a.id
     JOIN students s ON sub.student_id = s.id
     WHERE sub.id = ?`,
    [submissionId]
  );

  if (submissions.length === 0) throw new ApiError(404, 'Submission not found.');
  const submission = submissions[0];

  // Validate teacher owns assignment
  let teacherId = 1;
  if (teacherUser.role === 'teacher') {
    const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [teacherUser.id]);
    if (teacherRows.length === 0 || teacherRows[0].id !== submission.teacher_id) {
      throw new ApiError(403, 'Access denied. You can only evaluate submissions for assignments you created.');
    }
    teacherId = teacherRows[0].id;
  }

  // Validate marksObtained
  const maxMarks = parseFloat(submission.maximum_marks);
  const marksObtained = parseFloat(data.marksObtained);

  if (marksObtained < 0 || marksObtained > maxMarks) {
    throw new ApiError(400, `Marks obtained (${marksObtained}) must be between 0 and maximum marks (${maxMarks}).`);
  }

  const tx = await getTransaction();
  try {
    // Update submission status to evaluated
    await tx.execute(
      `UPDATE assignment_submissions
       SET marks_obtained = ?, teacher_feedback = ?, submission_status = 'evaluated', evaluated_by = ?, evaluated_at = NOW()
       WHERE id = ?`,
      [marksObtained, data.teacherFeedback || null, teacherId, submissionId]
    );

    // Notify student
    await createNotification(
      submission.student_user_id,
      'Assignment Evaluated',
      `Your submission for "${submission.assignment_title}" has been evaluated. Marks: ${marksObtained}/${maxMarks}.`,
      'assignment_evaluated',
      'assignments',
      submission.assignment_id
    );

    // Notify parents
    const parents = await tx.execute(
      `SELECT p.user_id FROM parents p
       JOIN parent_student_links l ON p.id = l.parent_id
       WHERE l.student_id = ?`,
      [submission.student_id]
    );

    for (const p of parents) {
      await createNotification(
        p.user_id,
        'Child Assignment Evaluated',
        `Your child's submission for "${submission.assignment_title}" has been evaluated. Marks: ${marksObtained}/${maxMarks}.`,
        'assignment_evaluated',
        'students',
        submission.student_id
      );
    }

    await tx.commit();
    return { submissionId, marksObtained, status: 'evaluated' };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

const getMySubmissions = async (user) => {
  const studentRows = await query('SELECT id FROM students WHERE user_id = ?', [user.id]);
  if (studentRows.length === 0) throw new ApiError(404, 'Student profile not found.');
  const studentId = studentRows[0].id;

  const sql = `
    SELECT sub.*, a.title as assignment_title, a.due_date, a.maximum_marks, s.name as subject_name
    FROM assignment_submissions sub
    JOIN assignments a ON sub.assignment_id = a.id
    JOIN subjects s ON a.subject_id = s.id
    WHERE sub.student_id = ?
    ORDER BY sub.submitted_at DESC
  `;
  return query(sql, [studentId]);
};

module.exports = {
  addStudyMaterial,
  getStudyMaterials,
  getStudyMaterialById,
  updateStudyMaterial,
  deleteStudyMaterial,
  createAssignment,
  getAssignmentsList,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissionsForAssignment,
  evaluateSubmission,
  getMySubmissions
};
