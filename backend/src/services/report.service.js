const { query } = require('../config/database');
const calculateAttendance = require('../utils/calculateAttendance');

// 1. Admin Dashboard Stats
const getAdminDashboardStats = async () => {
  // Counts
  const studentCount = await query('SELECT COUNT(*) as count FROM students');
  const teacherCount = await query('SELECT COUNT(*) as count FROM teachers');
  const parentCount = await query('SELECT COUNT(*) as count FROM parents');
  const classCount = await query('SELECT COUNT(*) as count FROM classes WHERE status = "active"');

  // Today's attendance
  const today = new Date().toISOString().split('T')[0];
  
  const todayRecords = await query(
    `SELECT ar.status FROM attendance_records ar
     JOIN attendance_sessions s ON ar.attendance_session_id = s.id
     WHERE s.attendance_date = ?`,
    [today]
  );
  
  let presentToday = 0;
  let absentToday = 0;
  let lateToday = 0;
  let leaveToday = 0;
  todayRecords.forEach(r => {
    if (r.status === 'present') presentToday++;
    else if (r.status === 'absent') absentToday++;
    else if (r.status === 'late') lateToday++;
    else if (r.status === 'leave') leaveToday++;
  });

  // Overall attendance percentage
  const allRecords = await query('SELECT status FROM attendance_records');
  const overallAtt = calculateAttendance(allRecords);

  // Low-attendance students (percentage < 75%)
  const lowAttendanceStudents = await query(
    `SELECT s.id as student_id, u.full_name, s.admission_number, w.attendance_percentage, w.message
     FROM attendance_warnings w
     JOIN students s ON w.student_id = s.id
     JOIN users u ON s.user_id = u.id
     WHERE w.status = 'unresolved' AND w.warning_level = 'low'
     ORDER BY w.attendance_percentage ASC`
  );

  // Recent announcements
  const recentAnnouncements = await query(
    `SELECT a.*, u.full_name as author_name FROM announcements a
     JOIN users u ON a.created_by = u.id
     ORDER BY a.created_at DESC LIMIT 5`
  );

  // Recent activities (audit logs)
  const recentActivities = await query(
    `SELECT al.*, u.full_name, u.role FROM audit_logs al
     JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC LIMIT 10`
  );

  // Monthly attendance chart data (last 6 months)
  const monthlyData = await query(
    `SELECT DATE_FORMAT(s.attendance_date, '%Y-%m') as month,
            SUM(CASE WHEN ar.status IN ('present', 'late') THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent
     FROM attendance_records ar
     JOIN attendance_sessions s ON ar.attendance_session_id = s.id
     GROUP BY month
     ORDER BY month DESC LIMIT 6`
  );

  return {
    counts: {
      students: studentCount[0].count,
      teachers: teacherCount[0].count,
      parents: parentCount[0].count,
      classes: classCount[0].count
    },
    todayAttendance: {
      present: presentToday,
      absent: absentToday,
      late: lateToday,
      leave: leaveToday,
      totalMarked: todayRecords.length
    },
    overallAttendancePercentage: overallAtt.percentage,
    lowAttendanceStudents,
    recentAnnouncements,
    recentActivities,
    monthlyAttendanceChart: monthlyData.reverse()
  };
};

// 2. Teacher Dashboard Stats
const getTeacherDashboardStats = async (userId) => {
  const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
  if (teachers.length === 0) return null;
  const teacherId = teachers[0].id;

  // Assigned classes
  const assigned = await query(
    `SELECT ta.*, c.name as class_name, sec.name as section_name, sub.name as subject_name
     FROM teacher_assignments ta
     JOIN classes c ON ta.class_id = c.id
     JOIN sections sec ON ta.section_id = sec.id
     JOIN subjects sub ON ta.subject_id = sub.id
     WHERE ta.teacher_id = ?`,
    [teacherId]
  );

  // Today's schedule
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todaySchedule = await query(
    `SELECT te.*, c.name as class_name, sec.name as section_name, sub.name as subject_name
     FROM timetable_entries te
     JOIN classes c ON te.class_id = c.id
     JOIN sections sec ON te.section_id = sec.id
     JOIN subjects sub ON te.subject_id = sub.id
     WHERE te.teacher_id = ? AND te.day_of_week = ?
     ORDER BY te.start_time ASC`,
    [teacherId, dayName]
  );

  // Pending attendance for today: classes scheduled today but no session marked
  const today = new Date().toISOString().split('T')[0];
  const pendingAttendance = [];
  
  for (const slot of todaySchedule) {
    const session = await query(
      `SELECT id FROM attendance_sessions
       WHERE class_id = ? AND section_id = ? AND subject_id = ? AND attendance_date = ? AND lecture_number = ?`,
      [slot.class_id, slot.section_id, slot.subject_id, today, slot.id] // using slot.id or a general count
    );
    if (session.length === 0) {
      pendingAttendance.push(slot);
    }
  }

  // Recent assignments
  const assignments = await query(
    `SELECT a.*, c.name as class_name, sec.name as section_name, sub.name as subject_name
     FROM assignments a
     JOIN classes c ON a.class_id = c.id
     JOIN sections sec ON a.section_id = sec.id
     JOIN subjects sub ON a.subject_id = sub.id
     WHERE a.teacher_id = ?
     ORDER BY a.created_at DESC LIMIT 5`,
    [teacherId]
  );

  // Pending evaluations: submissions for assignments created by teacher that are not evaluated
  const pendingEvaluations = await query(
    `SELECT sub.*, a.title as assignment_title, u.full_name as student_name, c.name as class_name, sec.name as section_name
     FROM assignment_submissions sub
     JOIN assignments a ON sub.assignment_id = a.id
     JOIN students s ON sub.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN student_enrollments se ON s.id = se.student_id AND se.enrollment_status = 'active'
     JOIN classes c ON se.class_id = c.id
     JOIN sections sec ON se.section_id = sec.id
     WHERE a.teacher_id = ? AND sub.submission_status IN ('submitted', 'late')
     ORDER BY sub.submitted_at ASC`,
    [teacherId]
  );

  // Low attendance students in assigned classes
  const lowAttendance = await query(
    `SELECT DISTINCT s.id as student_id, u.full_name, w.attendance_percentage, sub.name as subject_name, c.name as class_name, sec.name as section_name
     FROM attendance_warnings w
     JOIN students s ON w.student_id = s.id
     JOIN users u ON s.user_id = u.id
     JOIN subjects sub ON w.subject_id = sub.id
     JOIN student_enrollments se ON s.id = se.student_id AND se.enrollment_status = 'active'
     JOIN classes c ON se.class_id = c.id
     JOIN sections sec ON se.section_id = sec.id
     JOIN teacher_assignments ta ON ta.class_id = se.class_id AND ta.section_id = se.section_id AND ta.subject_id = w.subject_id
     WHERE ta.teacher_id = ? AND w.status = 'unresolved'
     ORDER BY w.attendance_percentage ASC`,
    [teacherId]
  );

  return {
    assignedClasses: assigned,
    todaySchedule,
    pendingAttendanceCount: pendingAttendance.length,
    recentAssignments: assignments,
    pendingEvaluationsCount: pendingEvaluations.length,
    pendingEvaluationsList: pendingEvaluations,
    lowAttendanceStudents: lowAttendance
  };
};

const exportAttendanceReport = async ({ userRole, userId, classId, sectionId, subjectId, startDate, endDate }) => {
  if (userRole !== 'admin' && userRole !== 'teacher') {
    throw new ApiError(403, 'Access denied. Report export is restricted to Admin and Teacher roles.');
  }

  const conditions = [];
  const params = [];

  if (userRole === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (teachers.length === 0) {
      throw new ApiError(403, 'Access denied. Teacher record not found.');
    }
    const teacherId = teachers[0].id;

    if (classId && sectionId && subjectId) {
      const assignment = await query(
        'SELECT id FROM teacher_assignments WHERE teacher_id = ? AND class_id = ? AND section_id = ? AND subject_id = ?',
        [teacherId, classId, sectionId, subjectId]
      );
      if (assignment.length === 0) {
        throw new ApiError(403, 'Access denied. You can only export reports for your assigned classes, sections and subjects.');
      }
    } else {
      conditions.push(`EXISTS (
        SELECT 1 FROM teacher_assignments ta
        WHERE ta.teacher_id = ? AND ta.class_id = s.class_id AND ta.section_id = s.section_id AND ta.subject_id = s.subject_id
      )`);
      params.push(teacherId);
    }
  }

  if (classId) {
    conditions.push('s.class_id = ?');
    params.push(classId);
  }
  if (sectionId) {
    conditions.push('s.section_id = ?');
    params.push(sectionId);
  }
  if (subjectId) {
    conditions.push('s.subject_id = ?');
    params.push(subjectId);
  }
  if (startDate) {
    conditions.push('s.attendance_date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    conditions.push('s.attendance_date <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      u.full_name as student_name,
      st.admission_number,
      c.name as class_name,
      sec.name as section_name,
      sub.name as subject_name,
      s.attendance_date,
      ar.status
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.attendance_session_id = s.id
    JOIN students st ON ar.student_id = st.id
    JOIN users u ON st.user_id = u.id
    JOIN classes c ON s.class_id = c.id
    JOIN sections sec ON s.section_id = sec.id
    JOIN subjects sub ON s.subject_id = sub.id
    ${whereClause}
    ORDER BY s.attendance_date DESC, u.full_name ASC
  `;

  const records = await query(sql, params);

  const headers = ['Student Name', 'Admission No', 'Class', 'Section', 'Subject', 'Date', 'Status'];
  const rows = records.map(r => [
    r.student_name,
    r.admission_number,
    r.class_name,
    r.section_name,
    r.subject_name,
    new Date(r.attendance_date).toISOString().split('T')[0],
    r.status.toUpperCase()
  ]);

  return { headers, rows };
};

const exportPerformanceReport = async ({ userRole, userId, classId, sectionId, subjectId }) => {
  if (userRole !== 'admin' && userRole !== 'teacher') {
    throw new ApiError(403, 'Access denied. Report export is restricted to Admin and Teacher roles.');
  }

  const conditions = [];
  const params = [];

  if (userRole === 'teacher') {
    const teachers = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (teachers.length === 0) {
      throw new ApiError(403, 'Access denied. Teacher record not found.');
    }
    const teacherId = teachers[0].id;

    if (classId && sectionId && subjectId) {
      const assignment = await query(
        'SELECT id FROM teacher_assignments WHERE teacher_id = ? AND class_id = ? AND section_id = ? AND subject_id = ?',
        [teacherId, classId, sectionId, subjectId]
      );
      if (assignment.length === 0) {
        throw new ApiError(403, 'Access denied. You can only export reports for your assigned classes, sections and subjects.');
      }
    } else {
      conditions.push(`EXISTS (
        SELECT 1 FROM teacher_assignments ta
        WHERE ta.teacher_id = ? AND ta.class_id = se.class_id AND ta.section_id = se.section_id AND ta.subject_id = m.subject_id
      )`);
      params.push(teacherId);
    }
  }

  if (classId) {
    conditions.push('se.class_id = ?');
    params.push(classId);
  }
  if (sectionId) {
    conditions.push('se.section_id = ?');
    params.push(sectionId);
  }
  if (subjectId) {
    conditions.push('m.subject_id = ?');
    params.push(subjectId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      u.full_name as student_name,
      st.admission_number,
      c.name as class_name,
      sec.name as section_name,
      sub.name as subject_name,
      e.name as exam_name,
      m.marks_obtained,
      m.total_marks,
      m.grade
    FROM marks m
    JOIN students st ON m.student_id = st.id
    JOIN users u ON st.user_id = u.id
    JOIN student_enrollments se ON st.id = se.student_id AND se.enrollment_status = 'active'
    JOIN classes c ON se.class_id = c.id
    JOIN sections sec ON se.section_id = sec.id
    JOIN subjects sub ON m.subject_id = sub.id
    JOIN exams e ON m.exam_id = e.id
    ${whereClause}
    ORDER BY u.full_name ASC
  `;

  const records = await query(sql, params);

  const headers = ['Student Name', 'Admission No', 'Class', 'Section', 'Subject', 'Exam', 'Marks Obtained', 'Total Marks', 'Grade'];
  const rows = records.map(r => [
    r.student_name,
    r.admission_number,
    r.class_name,
    r.section_name,
    r.subject_name,
    r.exam_name,
    r.marks_obtained,
    r.total_marks,
    r.grade || 'N/A'
  ]);

  return { headers, rows };
};

module.exports = {
  getAdminDashboardStats,
  getTeacherDashboardStats,
  exportAttendanceReport,
  exportPerformanceReport
};
