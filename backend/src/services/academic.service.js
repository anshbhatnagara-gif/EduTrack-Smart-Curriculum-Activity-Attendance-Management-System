const bcrypt = require('bcryptjs');
const { query, getTransaction } = require('../config/database');
const ApiError = require('../utils/ApiError');
const { formatPaginatedResponse } = require('../utils/pagination');

// ----------------------------------------------------
// USER/ROLE MANAGEMENT (TRANSACTIONAL)
// ----------------------------------------------------

const checkEmailUnique = async (email, excludeUserId = null, conn = null) => {
  const q = conn ? conn.execute.bind(conn) : query;
  let sql = 'SELECT id FROM users WHERE email = ?';
  const params = [email];
  if (excludeUserId) {
    sql += ' AND id != ?';
    params.push(excludeUserId);
  }
  const result = await q(sql, params);
  return result.length === 0;
};

// Teacher Transactional CRUD
const createTeacher = async (userData, teacherData) => {
  const tx = await getTransaction();
  try {
    const isEmailOk = await checkEmailUnique(userData.email, null, tx);
    if (!isEmailOk) {
      throw new ApiError(400, `Email "${userData.email}" is already registered.`);
    }

    const codeCheck = await tx.execute('SELECT id FROM teachers WHERE employee_code = ?', [teacherData.employeeCode]);
    if (codeCheck.length > 0) {
      throw new ApiError(400, `Employee code "${teacherData.employeeCode}" is already in use.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const userResult = await tx.execute(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, profile_image)
       VALUES (?, ?, ?, ?, 'teacher', 'active', ?)`,
      [userData.fullName, userData.email, userData.phone, passwordHash, userData.profileImage || null]
    );
    const userId = userResult.insertId;

    await tx.execute(
      `INSERT INTO teachers (user_id, employee_code, qualification, joining_date)
       VALUES (?, ?, ?, ?)`,
      [userId, teacherData.employeeCode, teacherData.qualification, teacherData.joiningDate]
    );

    await tx.commit();
    return { userId, email: userData.email, employeeCode: teacherData.employeeCode };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

const getTeachers = async (params) => {
  const { page, limit, offset, search, status } = params;
  let sql = `
    SELECT u.id as user_id, u.full_name, u.email, u.phone, u.status, u.profile_image,
           t.id as teacher_id, t.employee_code, t.qualification, t.joining_date, u.created_at
    FROM users u
    JOIN teachers t ON u.id = t.user_id
    WHERE 1=1
  `;
  const sqlParams = [];

  if (search) {
    sql += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR t.employee_code LIKE ?)';
    const searchVal = `%${search}%`;
    sqlParams.push(searchVal, searchVal, searchVal);
  }

  if (status) {
    sql += ' AND u.status = ?';
    sqlParams.push(status);
  }

  // Count query for pagination
  const countSql = `SELECT COUNT(*) as total FROM (${sql}) as temp`;
  const countResult = await query(countSql, sqlParams);
  const total = countResult[0].total;

  sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  sqlParams.push(parseInt(limit, 10), parseInt(offset, 10));

  const results = await query(sql, sqlParams);
  return formatPaginatedResponse(results, total, page, limit);
};

const getTeacherById = async (id) => {
  const sql = `
    SELECT u.id as user_id, u.full_name, u.email, u.phone, u.status, u.profile_image,
           t.id as teacher_id, t.employee_code, t.qualification, t.joining_date, u.created_at, u.updated_at
    FROM users u
    JOIN teachers t ON u.id = t.user_id
    WHERE t.id = ?
  `;
  const rows = await query(sql, [id]);
  if (rows.length === 0) {
    throw new ApiError(404, 'Teacher not found.');
  }
  return rows[0];
};

const updateTeacher = async (id, userData, teacherData) => {
  const tx = await getTransaction();
  try {
    const teacherRows = await tx.execute('SELECT user_id FROM teachers WHERE id = ?', [id]);
    if (teacherRows.length === 0) {
      throw new ApiError(404, 'Teacher not found.');
    }
    const userId = teacherRows[0].user_id;

    if (userData.email) {
      const isEmailOk = await checkEmailUnique(userData.email, userId, tx);
      if (!isEmailOk) {
        throw new ApiError(400, `Email "${userData.email}" is already registered.`);
      }
    }

    // Build dynamic update for users
    const userFields = [];
    const userParams = [];
    if (userData.fullName) { userFields.push('full_name = ?'); userParams.push(userData.fullName); }
    if (userData.email) { userFields.push('email = ?'); userParams.push(userData.email); }
    if (userData.phone) { userFields.push('phone = ?'); userParams.push(userData.phone); }
    if (userData.profileImage !== undefined) { userFields.push('profile_image = ?'); userParams.push(userData.profileImage); }

    if (userFields.length > 0) {
      userParams.push(userId);
      await tx.execute(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`, userParams);
    }

    // Build dynamic update for teachers
    const teachFields = [];
    const teachParams = [];
    if (teacherData.qualification) { teachFields.push('qualification = ?'); teachParams.push(teacherData.qualification); }
    if (teacherData.joiningDate) { teachFields.push('joining_date = ?'); teachParams.push(teacherData.joiningDate); }

    if (teachFields.length > 0) {
      teachParams.push(id);
      await tx.execute(`UPDATE teachers SET ${teachFields.join(', ')} WHERE id = ?`, teachParams);
    }

    await tx.commit();
    return getTeacherById(id);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

// Student Transactional CRUD
const createStudent = async (userData, studentData) => {
  const tx = await getTransaction();
  try {
    const isEmailOk = await checkEmailUnique(userData.email, null, tx);
    if (!isEmailOk) {
      throw new ApiError(400, `Email "${userData.email}" is already registered.`);
    }

    const admCheck = await tx.execute('SELECT id FROM students WHERE admission_number = ?', [studentData.admissionNumber]);
    if (admCheck.length > 0) {
      throw new ApiError(400, `Admission number "${studentData.admissionNumber}" is already in use.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const userResult = await tx.execute(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, profile_image)
       VALUES (?, ?, ?, ?, 'student', 'active', ?)`,
      [userData.fullName, userData.email, userData.phone, passwordHash, userData.profileImage || null]
    );
    const userId = userResult.insertId;

    await tx.execute(
      `INSERT INTO students (user_id, admission_number, roll_number, date_of_birth, gender, admission_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, studentData.admissionNumber, studentData.rollNumber || null, studentData.dateOfBirth, studentData.gender, studentData.admissionDate]
    );

    await tx.commit();
    return { userId, email: userData.email, admissionNumber: studentData.admissionNumber };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

const getStudents = async (params) => {
  const { page, limit, offset, search, status, classId, sectionId } = params;
  let sql = `
    SELECT u.id as user_id, u.full_name, u.email, u.phone, u.status, u.profile_image,
           s.id as student_id, s.admission_number, s.roll_number, s.date_of_birth, s.gender, s.admission_date, u.created_at,
           se.class_id, se.section_id, c.name as class_name, sec.name as section_name
    FROM users u
    JOIN students s ON u.id = s.user_id
    LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.enrollment_status = 'active'
    LEFT JOIN classes c ON se.class_id = c.id
    LEFT JOIN sections sec ON se.section_id = sec.id
    WHERE 1=1
  `;
  const sqlParams = [];

  if (search) {
    sql += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR s.admission_number LIKE ?)';
    const searchVal = `%${search}%`;
    sqlParams.push(searchVal, searchVal, searchVal);
  }

  if (status) {
    sql += ' AND u.status = ?';
    sqlParams.push(status);
  }

  if (classId) {
    sql += ' AND se.class_id = ?';
    sqlParams.push(classId);
  }

  if (sectionId) {
    sql += ' AND se.section_id = ?';
    sqlParams.push(sectionId);
  }

  const countResult = await query(`SELECT COUNT(*) as total FROM (${sql}) as temp`, sqlParams);
  const total = countResult[0].total;

  sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  sqlParams.push(parseInt(limit, 10), parseInt(offset, 10));

  const results = await query(sql, sqlParams);
  return formatPaginatedResponse(results, total, page, limit);
};

const getStudentById = async (id) => {
  const sql = `
    SELECT u.id as user_id, u.full_name, u.email, u.phone, u.status, u.profile_image,
           s.id as student_id, s.admission_number, s.roll_number, s.date_of_birth, s.gender, s.admission_date, u.created_at, u.updated_at,
           se.class_id, se.section_id, c.name as class_name, sec.name as section_name
    FROM users u
    JOIN students s ON u.id = s.user_id
    LEFT JOIN student_enrollments se ON s.id = se.student_id AND se.enrollment_status = 'active'
    LEFT JOIN classes c ON se.class_id = c.id
    LEFT JOIN sections sec ON se.section_id = sec.id
    WHERE s.id = ?
  `;
  const rows = await query(sql, [id]);
  if (rows.length === 0) {
    throw new ApiError(404, 'Student not found.');
  }
  return rows[0];
};

const updateStudent = async (id, userData, studentData) => {
  const tx = await getTransaction();
  try {
    const studentRows = await tx.execute('SELECT user_id FROM students WHERE id = ?', [id]);
    if (studentRows.length === 0) {
      throw new ApiError(404, 'Student not found.');
    }
    const userId = studentRows[0].user_id;

    if (userData.email) {
      const isEmailOk = await checkEmailUnique(userData.email, userId, tx);
      if (!isEmailOk) {
        throw new ApiError(400, `Email "${userData.email}" is already registered.`);
      }
    }

    const userFields = [];
    const userParams = [];
    if (userData.fullName) { userFields.push('full_name = ?'); userParams.push(userData.fullName); }
    if (userData.email) { userFields.push('email = ?'); userParams.push(userData.email); }
    if (userData.phone) { userFields.push('phone = ?'); userParams.push(userData.phone); }
    if (userData.profileImage !== undefined) { userFields.push('profile_image = ?'); userParams.push(userData.profileImage); }

    if (userFields.length > 0) {
      userParams.push(userId);
      await tx.execute(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`, userParams);
    }

    const studFields = [];
    const studParams = [];
    if (studentData.rollNumber !== undefined) { studFields.push('roll_number = ?'); studParams.push(studentData.rollNumber); }
    if (studentData.dateOfBirth) { studFields.push('date_of_birth = ?'); studParams.push(studentData.dateOfBirth); }
    if (studentData.gender) { studFields.push('gender = ?'); studParams.push(studentData.gender); }
    if (studentData.admissionDate) { studFields.push('admission_date = ?'); studParams.push(studentData.admissionDate); }

    if (studFields.length > 0) {
      studParams.push(id);
      await tx.execute(`UPDATE students SET ${studFields.join(', ')} WHERE id = ?`, studParams);
    }

    await tx.commit();
    return getStudentById(id);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

// Parent Transactional CRUD
const createParent = async (userData, parentData) => {
  const tx = await getTransaction();
  try {
    const isEmailOk = await checkEmailUnique(userData.email, null, tx);
    if (!isEmailOk) {
      throw new ApiError(400, `Email "${userData.email}" is already registered.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    const userResult = await tx.execute(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status, profile_image)
       VALUES (?, ?, ?, ?, 'parent', 'active', ?)`,
      [userData.fullName, userData.email, userData.phone, passwordHash, userData.profileImage || null]
    );
    const userId = userResult.insertId;

    await tx.execute(
      `INSERT INTO parents (user_id, occupation, relationship_type)
       VALUES (?, ?, ?)`,
      [userId, parentData.occupation, parentData.relationshipType]
    );

    await tx.commit();
    return { userId, email: userData.email };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

const getParents = async (params) => {
  const { page, limit, offset, search, status } = params;
  let sql = `
    SELECT u.id as user_id, u.full_name, u.email, u.phone, u.status, u.profile_image,
           p.id as parent_id, p.occupation, p.relationship_type, u.created_at
    FROM users u
    JOIN parents p ON u.id = p.user_id
    WHERE 1=1
  `;
  const sqlParams = [];

  if (search) {
    sql += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
    const searchVal = `%${search}%`;
    sqlParams.push(searchVal, searchVal);
  }

  if (status) {
    sql += ' AND u.status = ?';
    sqlParams.push(status);
  }

  const countResult = await query(`SELECT COUNT(*) as total FROM (${sql}) as temp`, sqlParams);
  const total = countResult[0].total;

  sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  sqlParams.push(parseInt(limit, 10), parseInt(offset, 10));

  const results = await query(sql, sqlParams);
  return formatPaginatedResponse(results, total, page, limit);
};

const getParentById = async (id) => {
  const sql = `
    SELECT u.id as user_id, u.full_name, u.email, u.phone, u.status, u.profile_image,
           p.id as parent_id, p.occupation, p.relationship_type, u.created_at, u.updated_at
    FROM users u
    JOIN parents p ON u.id = p.user_id
    WHERE p.id = ?
  `;
  const rows = await query(sql, [id]);
  if (rows.length === 0) {
    throw new ApiError(404, 'Parent not found.');
  }
  return rows[0];
};

const updateParent = async (id, userData, parentData) => {
  const tx = await getTransaction();
  try {
    const parentRows = await tx.execute('SELECT user_id FROM parents WHERE id = ?', [id]);
    if (parentRows.length === 0) {
      throw new ApiError(404, 'Parent not found.');
    }
    const userId = parentRows[0].user_id;

    if (userData.email) {
      const isEmailOk = await checkEmailUnique(userData.email, userId, tx);
      if (!isEmailOk) {
        throw new ApiError(400, `Email "${userData.email}" is already registered.`);
      }
    }

    const userFields = [];
    const userParams = [];
    if (userData.fullName) { userFields.push('full_name = ?'); userParams.push(userData.fullName); }
    if (userData.email) { userFields.push('email = ?'); userParams.push(userData.email); }
    if (userData.phone) { userFields.push('phone = ?'); userParams.push(userData.phone); }
    if (userData.profileImage !== undefined) { userFields.push('profile_image = ?'); userParams.push(userData.profileImage); }

    if (userFields.length > 0) {
      userParams.push(userId);
      await tx.execute(`UPDATE users SET ${userFields.join(', ')} WHERE id = ?`, userParams);
    }

    const prFields = [];
    const prParams = [];
    if (parentData.occupation) { prFields.push('occupation = ?'); prParams.push(parentData.occupation); }
    if (parentData.relationshipType) { prFields.push('relationship_type = ?'); prParams.push(parentData.relationshipType); }

    if (prFields.length > 0) {
      prParams.push(id);
      await tx.execute(`UPDATE parents SET ${prFields.join(', ')} WHERE id = ?`, prParams);
    }

    await tx.commit();
    return getParentById(id);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

const changeUserStatus = async (userId, status) => {
  const result = await query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
  if (result.affectedRows === 0) {
    throw new ApiError(404, 'User not found.');
  }
  return true;
};

// Parent-Student Linking
const linkParentStudent = async (parentId, studentId, relationship, isPrimary = 0) => {
  // Validate parent exists
  const parentCheck = await query('SELECT id FROM parents WHERE id = ?', [parentId]);
  if (parentCheck.length === 0) {
    throw new ApiError(404, `Parent with ID ${parentId} does not exist.`);
  }

  // Validate student exists
  const studentCheck = await query('SELECT id FROM students WHERE id = ?', [studentId]);
  if (studentCheck.length === 0) {
    throw new ApiError(404, `Student with ID ${studentId} does not exist.`);
  }

  // Insert or update link
  const result = await query(
    `INSERT INTO parent_student_links (parent_id, student_id, relationship, is_primary)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE relationship = ?, is_primary = ?`,
    [parentId, studentId, relationship, isPrimary ? 1 : 0, relationship, isPrimary ? 1 : 0]
  );
  return result;
};

const getLinkedStudents = async (parentId) => {
  const sql = `
    SELECT s.id as student_id, u.full_name, u.email, s.admission_number, s.roll_number, l.relationship, l.is_primary
    FROM parent_student_links l
    JOIN students s ON l.student_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE l.parent_id = ?
  `;
  return query(sql, [parentId]);
};

// ----------------------------------------------------
// ACADEMIC DATA MANAGEMENT (CRUD)
// ----------------------------------------------------

// Academic Sessions
const createAcademicSession = async (data) => {
  const tx = await getTransaction();
  try {
    if (data.isActive) {
      await tx.execute('UPDATE academic_sessions SET is_active = 0');
    }
    const result = await tx.execute(
      `INSERT INTO academic_sessions (name, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?)`,
      [data.name, data.startDate, data.endDate, data.isActive ? 1 : 0]
    );
    await tx.commit();
    return { id: result.insertId, ...data };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

const getAcademicSessions = async () => {
  return query('SELECT * FROM academic_sessions ORDER BY start_date DESC');
};

const updateAcademicSession = async (id, data) => {
  const tx = await getTransaction();
  try {
    if (data.isActive) {
      await tx.execute('UPDATE academic_sessions SET is_active = 0');
    }

    const fields = [];
    const params = [];
    if (data.name) { fields.push('name = ?'); params.push(data.name); }
    if (data.startDate) { fields.push('start_date = ?'); params.push(data.startDate); }
    if (data.endDate) { fields.push('end_date = ?'); params.push(data.endDate); }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); params.push(data.isActive ? 1 : 0); }

    if (fields.length > 0) {
      params.push(id);
      await tx.execute(`UPDATE academic_sessions SET ${fields.join(', ')} WHERE id = ?`, params);
    }
    await tx.commit();
    
    const rows = await query('SELECT * FROM academic_sessions WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

// Classes
const createClass = async (data) => {
  const result = await query(
    `INSERT INTO classes (name, numeric_level, academic_session_id, status)
     VALUES (?, ?, ?, ?)`,
    [data.name, data.numericLevel, data.academicSessionId, data.status || 'active']
  );
  return { id: result.insertId, ...data };
};

const getClasses = async (sessionId = null) => {
  let sql = 'SELECT c.*, s.name as session_name FROM classes c JOIN academic_sessions s ON c.academic_session_id = s.id';
  const params = [];
  if (sessionId) {
    sql += ' WHERE c.academic_session_id = ?';
    params.push(sessionId);
  }
  return query(sql, params);
};

const updateClass = async (id, data) => {
  const fields = [];
  const params = [];
  if (data.name) { fields.push('name = ?'); params.push(data.name); }
  if (data.numericLevel) { fields.push('numeric_level = ?'); params.push(data.numericLevel); }
  if (data.academicSessionId) { fields.push('academic_session_id = ?'); params.push(data.academicSessionId); }
  if (data.status) { fields.push('status = ?'); params.push(data.status); }

  if (fields.length > 0) {
    params.push(id);
    await query(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`, params);
  }
  const rows = await query('SELECT * FROM classes WHERE id = ?', [id]);
  return rows[0];
};

// Sections
const createSection = async (data) => {
  const result = await query(
    `INSERT INTO sections (class_id, name, room_number, capacity)
     VALUES (?, ?, ?, ?)`,
    [data.classId, data.name, data.roomNumber, data.capacity]
  );
  return { id: result.insertId, ...data };
};

const getSections = async (classId = null) => {
  let sql = 'SELECT sec.*, c.name as class_name FROM sections sec JOIN classes c ON sec.class_id = c.id';
  const params = [];
  if (classId) {
    sql += ' WHERE sec.class_id = ?';
    params.push(classId);
  }
  return query(sql, params);
};

const updateSection = async (id, data) => {
  const fields = [];
  const params = [];
  if (data.classId) { fields.push('class_id = ?'); params.push(data.classId); }
  if (data.name) { fields.push('name = ?'); params.push(data.name); }
  if (data.roomNumber) { fields.push('room_number = ?'); params.push(data.roomNumber); }
  if (data.capacity) { fields.push('capacity = ?'); params.push(data.capacity); }

  if (fields.length > 0) {
    params.push(id);
    await query(`UPDATE sections SET ${fields.join(', ')} WHERE id = ?`, params);
  }
  const rows = await query('SELECT * FROM sections WHERE id = ?', [id]);
  return rows[0];
};

// Subjects
const createSubject = async (data) => {
  const codeCheck = await query('SELECT id FROM subjects WHERE subject_code = ?', [data.subjectCode]);
  if (codeCheck.length > 0) {
    throw new ApiError(400, `Subject code "${data.subjectCode}" is already in use.`);
  }

  const result = await query(
    `INSERT INTO subjects (subject_code, name, description)
     VALUES (?, ?, ?)`,
    [data.subjectCode, data.name, data.description || null]
  );
  return { id: result.insertId, ...data };
};

const getSubjects = async () => {
  return query('SELECT * FROM subjects ORDER BY subject_code ASC');
};

const getSubjectById = async (id) => {
  const rows = await query('SELECT * FROM subjects WHERE id = ?', [id]);
  if (rows.length === 0) {
    throw new ApiError(404, 'Subject not found.');
  }
  return rows[0];
};

const updateSubject = async (id, data) => {
  if (data.subjectCode) {
    const codeCheck = await query('SELECT id FROM subjects WHERE subject_code = ? AND id != ?', [data.subjectCode, id]);
    if (codeCheck.length > 0) {
      throw new ApiError(400, `Subject code "${data.subjectCode}" is already in use.`);
    }
  }

  const fields = [];
  const params = [];
  if (data.subjectCode) { fields.push('subject_code = ?'); params.push(data.subjectCode); }
  if (data.name) { fields.push('name = ?'); params.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }

  if (fields.length > 0) {
    params.push(id);
    await query(`UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`, params);
  }
  return getSubjectById(id);
};

// Teacher Assignments
const assignTeacher = async (data) => {
  // Check if unique assignment combination already exists
  const existing = await query(
    `SELECT id FROM teacher_assignments
     WHERE teacher_id = ? AND class_id = ? AND section_id = ? AND subject_id = ? AND academic_session_id = ?`,
    [data.teacherId, data.classId, data.sectionId, data.subjectId, data.academicSessionId]
  );

  if (existing.length > 0) {
    throw new ApiError(400, 'This teacher is already assigned to this class, section, and subject for the session.');
  }

  const result = await query(
    `INSERT INTO teacher_assignments (teacher_id, class_id, section_id, subject_id, academic_session_id)
     VALUES (?, ?, ?, ?, ?)`,
    [data.teacherId, data.classId, data.sectionId, data.subjectId, data.academicSessionId]
  );
  return { id: result.insertId, ...data };
};

const getTeacherAssignmentsList = async (teacherId = null) => {
  let sql = `
    SELECT ta.*, u.full_name as teacher_name, c.name as class_name, sec.name as section_name, sub.name as subject_name, s.name as session_name
    FROM teacher_assignments ta
    JOIN teachers t ON ta.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    JOIN classes c ON ta.class_id = c.id
    JOIN sections sec ON ta.section_id = sec.id
    JOIN subjects sub ON ta.subject_id = sub.id
    JOIN academic_sessions s ON ta.academic_session_id = s.id
  `;
  const params = [];
  if (teacherId) {
    sql += ' WHERE ta.teacher_id = ?';
    params.push(teacherId);
  }
  return query(sql, params);
};

const removeTeacherAssignment = async (id) => {
  const result = await query('DELETE FROM teacher_assignments WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Teacher assignment not found.');
  }
  return true;
};

// Student Enrollments
const enrollStudent = async (data) => {
  const tx = await getTransaction();
  try {
    // Verify class and section match
    const secCheck = await tx.execute('SELECT id FROM sections WHERE id = ? AND class_id = ?', [data.sectionId, data.classId]);
    if (secCheck.length === 0) {
      throw new ApiError(400, 'Selected section does not belong to the selected class.');
    }

    // Check duplicate active enrollment for student in academic session
    const activeCheck = await tx.execute(
      `SELECT id FROM student_enrollments
       WHERE student_id = ? AND academic_session_id = ? AND enrollment_status = 'active'`,
      [data.studentId, data.academicSessionId]
    );

    if (activeCheck.length > 0) {
      throw new ApiError(400, 'Student already has an active enrollment in this academic session.');
    }

    const result = await tx.execute(
      `INSERT INTO student_enrollments (student_id, class_id, section_id, academic_session_id, roll_number, enrollment_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.studentId, data.classId, data.sectionId, data.academicSessionId, data.rollNumber, data.enrollmentStatus || 'active']
    );

    await tx.commit();
    return { id: result.insertId, ...data };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};

const getStudentEnrollments = async (classId = null, sectionId = null) => {
  let sql = `
    SELECT se.*, u.full_name as student_name, s.admission_number, c.name as class_name, sec.name as section_name, ses.name as session_name
    FROM student_enrollments se
    JOIN students s ON se.student_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN classes c ON se.class_id = c.id
    JOIN sections sec ON se.section_id = sec.id
    JOIN academic_sessions ses ON se.academic_session_id = ses.id
  `;
  const params = [];
  if (classId) {
    sql += ' WHERE se.class_id = ?';
    params.push(classId);
  }
  if (sectionId) {
    sql += classId ? ' AND se.section_id = ?' : ' WHERE se.section_id = ?';
    params.push(sectionId);
  }
  return query(sql, params);
};

const updateEnrollmentStatus = async (id, status) => {
  const result = await query(
    'UPDATE student_enrollments SET enrollment_status = ? WHERE id = ?',
    [status, id]
  );
  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Enrollment not found.');
  }
  return true;
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  createParent,
  getParents,
  getParentById,
  updateParent,
  changeUserStatus,
  linkParentStudent,
  getLinkedStudents,
  createAcademicSession,
  getAcademicSessions,
  updateAcademicSession,
  createClass,
  getClasses,
  updateClass,
  createSection,
  getSections,
  updateSection,
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  assignTeacher,
  getTeacherAssignmentsList,
  removeTeacherAssignment,
  enrollStudent,
  getStudentEnrollments,
  updateEnrollmentStatus
};
