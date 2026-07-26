# EduTrack Frontend to Backend API Mapping Matrix

This document maps all verified backend API endpoints to their corresponding frontend usage, allowed user roles, payload requirements, and response payload formats.

---

## Response Envelopes

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": {}
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Readable error message",
  "errors": []
}
```

---

## Role Capitalization & Values
The backend returns user roles as lowercase strings:
- `'admin'`
- `'teacher'`
- `'student'`
- `'parent'`

---

## API Endpoints Table

| Feature | Method | Mounted Endpoint | Allowed Roles | Request Body / Query Params | Response `data` Fields | Upload Content Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **System Health** | `GET` | `/api/health` | Public | None | `{ timestamp, uptime }` | `application/json` | Available |
| **Login** | `POST` | `/api/auth/login` | Public | Body: `{ email, password }` | `{ user, token }` | `application/json` | Available |
| **Get Session** | `GET` | `/api/auth/me` | Authenticated | None | `{ id, full_name, email, phone, role, status, profile_image, last_login_at, teacherInfo/studentInfo/parentInfo }` | `application/json` | Available |
| **Logout** | `POST` | `/api/auth/logout` | Authenticated | None | `{}` | `application/json` | Available |
| **Change Password** | `PUT` | `/api/auth/change-password` | Authenticated | Body: `{ oldPassword, newPassword }` | `{}` | `application/json` | Available |
| **User Profile** | `GET` | `/api/users/profile` | Authenticated | None | `{ id, full_name, email, role, ... }` | `application/json` | Available |
| **Parent Children** | `GET` | `/api/users/children` | `parent` | None | `[ { student_id, full_name, admission_number, roll_number, relationship } ]` | `application/json` | Available |
| **Parent Child Detail** | `GET` | `/api/users/children/:childStudentId` | `parent` | Params: `childStudentId` | `{ student_id, user_id, full_name, email, admission_number, roll_number, class_name, section_name }` | `application/json` | Available |
| **Teachers List** | `GET` | `/api/admin/teachers` | `admin` | Query: `page, limit, search, status` | `[ { user_id, teacher_id, full_name, email, employee_code, qualification, joining_date } ]` | `application/json` | Available |
| **Create Teacher** | `POST` | `/api/admin/teachers` | `admin` | Body: `{ fullName, email, phone, password, employeeCode, qualification, joiningDate, profileImage }` | `{ userId, email, employeeCode }` | `application/json` | Available |
| **Teacher Details** | `GET` | `/api/admin/teachers/:id` | `admin` | Params: `id` | `{ teacher_id, user_id, full_name, email, phone, employee_code, qualification }` | `application/json` | Available |
| **Update Teacher** | `PUT` | `/api/admin/teachers/:id` | `admin` | Body: `{ fullName, email, phone, qualification, joiningDate, profileImage }` | `{ teacher_id, full_name, email, ... }` | `application/json` | Available |
| **Teacher Status** | `PATCH` | `/api/admin/teachers/:id/status` | `admin` | Body: `{ status }` | `{}` | `application/json` | Available |
| **Students List** | `GET` | `/api/admin/students` | `admin` | Query: `page, limit, search, status, classId, sectionId` | `[ { user_id, student_id, full_name, email, admission_number, roll_number, class_name } ]` | `application/json` | Available |
| **Create Student** | `POST` | `/api/admin/students` | `admin` | Body: `{ fullName, email, phone, password, admissionNumber, rollNumber, dateOfBirth, gender, admissionDate, profileImage }` | `{ userId, email, admissionNumber }` | `application/json` | Available |
| **Student Details** | `GET` | `/api/admin/students/:id` | `admin` | Params: `id` | `{ student_id, user_id, full_name, email, admission_number, roll_number, class_name }` | `application/json` | Available |
| **Update Student** | `PUT` | `/api/admin/students/:id` | `admin` | Body: `{ fullName, email, phone, rollNumber, dateOfBirth, gender, admissionDate, profileImage }` | `{ student_id, full_name, ... }` | `application/json` | Available |
| **Student Status** | `PATCH` | `/api/admin/students/:id/status` | `admin` | Body: `{ status }` | `{}` | `application/json` | Available |
| **Parents List** | `GET` | `/api/admin/parents` | `admin` | Query: `page, limit, search, status` | `[ { user_id, parent_id, full_name, email, phone, occupation, relationship_type } ]` | `application/json` | Available |
| **Create Parent** | `POST` | `/api/admin/parents` | `admin` | Body: `{ fullName, email, phone, password, occupation, relationshipType, profileImage }` | `{ userId, email }` | `application/json` | Available |
| **Parent Details** | `GET` | `/api/admin/parents/:id` | `admin` | Params: `id` | `{ parent_id, user_id, full_name, email, occupation, relationship_type }` | `application/json` | Available |
| **Update Parent** | `PUT` | `/api/admin/parents/:id` | `admin` | Body: `{ fullName, email, phone, occupation, relationshipType, profileImage }` | `{ parent_id, full_name, ... }` | `application/json` | Available |
| **Parent Status** | `PATCH` | `/api/admin/parents/:id/status` | `admin` | Body: `{ status }` | `{}` | `application/json` | Available |
| **Link Parent-Student** | `POST` | `/api/admin/parents/link` | `admin` | Body: `{ parentId, studentId, relationship, isPrimary }` | `{}` | `application/json` | Available |
| **Parent Linked Children** | `GET` | `/api/admin/parents/:parentId/students` | `admin` | Params: `parentId` | `[ { student_id, full_name, admission_number, relationship } ]` | `application/json` | Available |
| **Sessions List** | `GET` | `/api/academic/sessions` | Authenticated | None | `[ { id, name, start_date, end_date, is_active } ]` | `application/json` | Available |
| **Create Session** | `POST` | `/api/academic/sessions` | `admin` | Body: `{ name, startDate, endDate, isActive }` | `{ id, name, startDate, endDate, isActive }` | `application/json` | Available |
| **Update Session** | `PUT` | `/api/academic/sessions/:id` | `admin` | Body: `{ name, startDate, endDate, isActive }` | `{ id, name, ... }` | `application/json` | Available |
| **Classes List** | `GET` | `/api/academic/classes` | Authenticated | Query: `academicSessionId` | `[ { id, name, numeric_level, status } ]` | `application/json` | Available |
| **Create Class** | `POST` | `/api/academic/classes` | `admin` | Body: `{ name, numericLevel, academicSessionId, status }` | `{ id, name, numericLevel }` | `application/json` | Available |
| **Update Class** | `PUT` | `/api/academic/classes/:id` | `admin` | Body: `{ name, numericLevel, academicSessionId, status }` | `{ id, name, ... }` | `application/json` | Available |
| **Sections List** | `GET` | `/api/academic/sections` | Authenticated | Query: `classId` | `[ { id, class_id, name, room_number, capacity } ]` | `application/json` | Available |
| **Create Section** | `POST` | `/api/academic/sections` | `admin` | Body: `{ classId, name, roomNumber, capacity }` | `{ id, classId, name }` | `application/json` | Available |
| **Update Section** | `PUT` | `/api/academic/sections/:id` | `admin` | Body: `{ classId, name, roomNumber, capacity }` | `{ id, classId, ... }` | `application/json` | Available |
| **Subjects List** | `GET` | `/api/academic/subjects` | Authenticated | None | `[ { id, subject_code, name, description } ]` | `application/json` | Available |
| **Create Subject** | `POST` | `/api/academic/subjects` | `admin` | Body: `{ subjectCode, name, description }` | `{ id, subjectCode, name }` | `application/json` | Available |
| **Subject Details** | `GET` | `/api/academic/subjects/:id` | Authenticated | Params: `id` | `{ id, subject_code, name, description }` | `application/json` | Available |
| **Update Subject** | `PUT` | `/api/academic/subjects/:id` | `admin` | Body: `{ subjectCode, name, description }` | `{ id, subjectCode, ... }` | `application/json` | Available |
| **Assignments List** | `GET` | `/api/academic/assignments` | Authenticated | Query: `teacherId` | `[ { assignment_id, teacher_name, class_name, section_name, subject_name } ]` | `application/json` | Available |
| **Assign Teacher** | `POST` | `/api/academic/assignments` | `admin` | Body: `{ teacherId, classId, sectionId, subjectId, academicSessionId }` | `{ id, teacherId, classId }` | `application/json` | Available |
| **Delete Assignment** | `DELETE` | `/api/academic/assignments/:id` | `admin` | Params: `id` | `{}` | `application/json` | Available |
| **Enrollments List** | `GET` | `/api/academic/enrollments` | Authenticated | Query: `classId, sectionId` | `[ { id, student_name, admission_number, class_name, section_name, roll_number } ]` | `application/json` | Available |
| **Enroll Student** | `POST` | `/api/academic/enrollments` | `admin` | Body: `{ studentId, classId, sectionId, academicSessionId, rollNumber, enrollmentStatus }` | `{ id, studentId, rollNumber }` | `application/json` | Available |
| **Update Enrollment** | `PUT` | `/api/academic/enrollments/:id` | `admin` | Body: `{ enrollmentStatus }` | `{}` | `application/json` | Available |
| **Teacher Classes** | `GET` | `/api/teacher/assignments` | `teacher`, `admin` | None | `[ { assignment_id, class_id, class_name, section_id, section_name, subject_id, subject_name } ]` | `application/json` | Available |
| **Attendance Sheet Students** | `GET` | `/api/attendance/students` | `teacher`, `admin` | Query: `classId, sectionId, academicSessionId` | `[ { student_id, full_name, admission_number, roll_number } ]` | `application/json` | Available |
| **Submit Attendance** | `POST` | `/api/attendance` | `teacher`, `admin` | Body: `{ classId, sectionId, subjectId, academicSessionId, attendanceDate, lectureNumber, startTime, endTime, records }` | `{ sessionId }` | `application/json` | Available |
| **Attendance Sessions** | `GET` | `/api/attendance/sessions` | `teacher`, `admin` | Query: `classId, sectionId, subjectId, startDate, endDate` | `[ { id, class_name, section_name, subject_name, attendance_date, lecture_number } ]` | `application/json` | Available |
| **Session Details** | `GET` | `/api/attendance/sessions/:id` | `teacher`, `admin` | Params: `id` | `{ session, records }` | `application/json` | Available |
| **Correct Attendance** | `PUT` | `/api/attendance/records/:id` | `teacher`, `admin` | Body: `{ status, correctionReason }` | `{ recordId, status }` | `application/json` | Available |
| **My Attendance Stats** | `GET` | `/api/attendance/student/me` | `student` | None | `{ overall, subjectStats }` | `application/json` | Available |
| **Student Attendance Stats** | `GET` | `/api/attendance/student/:studentId` | `parent`, `teacher`, `admin` | Params: `studentId` | `{ overall, subjectStats }` | `application/json` | Available |
| **Class Attendance Stats** | `GET` | `/api/attendance/class/:classId` | `teacher`, `admin` | Query: `sectionId` | `{ totalClasses, attendedClasses, absentClasses, lateCount, leaveCount, percentage }` | `application/json` | Available |
| **Study Materials List** | `GET` | `/api/materials` | Authenticated | Query: `classId, subjectId` | `[ { id, title, description, material_type, file_path, external_url, unit_name, topic_name } ]` | `application/json` | Available |
| **Upload Study Material** | `POST` | `/api/materials` | `teacher`, `admin` | FormData: `file, title, description, classId, sectionId, subjectId, externalUrl, unitName, topicName` | `{ id, title, materialType, filePath }` | `multipart/form-data` | Available |
| **Update Study Material** | `PUT` | `/api/materials/:id` | `teacher`, `admin` | FormData | `{ id, title, ... }` | `multipart/form-data` | Available |
| **Delete Study Material** | `DELETE` | `/api/materials/:id` | `teacher`, `admin` | Params: `id` | `{}` | `application/json` | Available |
| **Assignments List** | `GET` | `/api/assignments` | Authenticated | Query: `subjectId` | `[ { id, title, description, due_date, maximum_marks, subject_name, class_name } ]` | `application/json` | Available |
| **Create Assignment** | `POST` | `/api/assignments` | `teacher`, `admin` | FormData: `file, classId, sectionId, subjectId, title, description, dueDate, maximumMarks` | `{ id, title, dueDate }` | `multipart/form-data` | Available |
| **Update Assignment** | `PUT` | `/api/assignments/:id` | `teacher`, `admin` | FormData | `{ id, title, ... }` | `multipart/form-data` | Available |
| **Delete Assignment** | `DELETE` | `/api/assignments/:id` | `teacher`, `admin` | Params: `id` | `{}` | `application/json` | Available |
| **Submit Assignment** | `POST` | `/api/assignments/:id/submissions` | `student` | FormData: `file, submissionText` | `{ submissionId, updated }` | `multipart/form-data` | Available |
| **Get Submissions List** | `GET` | `/api/assignments/:id/submissions` | `teacher`, `admin` | Params: `id` | `[ { id, student_name, admission_number, submission_status, marks_obtained } ]` | `application/json` | Available |
| **My Submissions** | `GET` | `/api/submissions/me` | `student` | None | `[ { id, assignment_title, due_date, maximum_marks, marks_obtained, submission_status } ]` | `application/json` | Available |
| **Evaluate Submission** | `PUT` | `/api/submissions/:id/evaluate` | `teacher`, `admin` | Body: `{ marksObtained, teacherFeedback }` | `{ submissionId, marksObtained, status }` | `application/json` | Available |
| **Exams List** | `GET` | `/api/marks/exams` | Authenticated | Query: `academicSessionId` | `[ { id, name, exam_type, start_date, end_date, status } ]` | `application/json` | Available |
| **Create Exam** | `POST` | `/api/marks/exams` | `admin` | Body: `{ name, examType, academicSessionId, startDate, endDate, status }` | `{ id, name, examType }` | `application/json` | Available |
| **Record Marks** | `POST` | `/api/marks` | `teacher`, `admin` | Body: `{ examId, studentId, classId, sectionId, subjectId, maximumMarks, marksObtained, remarks }` | `{ id, grade }` | `application/json` | Available |
| **Update Marks** | `PUT` | `/api/marks/:id` | `teacher`, `admin` | Body: `{ marksObtained, remarks }` | `{ id, marksObtained, grade }` | `application/json` | Available |
| **My Marks** | `GET` | `/api/marks/student/me` | `student` | None | `[ { id, exam_name, subject_name, maximum_marks, marks_obtained, grade } ]` | `application/json` | Available |
| **Student Marks** | `GET` | `/api/marks/student/:studentId` | `parent`, `teacher`, `admin` | Params: `studentId` | `[ { id, exam_name, subject_name, maximum_marks, marks_obtained, grade } ]` | `application/json` | Available |
| **Class Marks** | `GET` | `/api/marks/class/:classId` | `teacher`, `admin` | Query: `examId, subjectId` | `[ { id, student_name, exam_name, subject_name, marks_obtained, grade } ]` | `application/json` | Available |
| **Timetable List** | `GET` | `/api/timetable` | Authenticated | Query: `classId, sectionId, teacherId` | `{ Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] }` | `application/json` | Available |
| **My Timetable** | `GET` | `/api/timetable/me` | Authenticated | None | `{ Monday: [], Tuesday: [], ... }` | `application/json` | Available |
| **Create Timetable Entry** | `POST` | `/api/timetable` | `admin` | Body: `{ academicSessionId, classId, sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNumber }` | `{ id }` | `application/json` | Available |
| **Update Timetable Entry** | `PUT` | `/api/timetable/:id` | `admin` | Body: `{ academicSessionId, classId, sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNumber }` | `{}` | `application/json` | Available |
| **Delete Timetable Entry** | `DELETE` | `/api/timetable/:id` | `admin` | Params: `id` | `{}` | `application/json` | Available |
| **Announcements List** | `GET` | `/api/announcements` | Authenticated | None | `[ { id, title, message, target_role, author_name, priority, publish_at } ]` | `application/json` | Available |
| **Create Announcement** | `POST` | `/api/announcements` | `teacher`, `admin` | Body: `{ title, message, targetRole, classId, sectionId, priority, expiresAt }` | `{ id }` | `application/json` | Available |
| **Update Announcement** | `PUT` | `/api/announcements/:id` | `teacher`, `admin` | Body: `{ title, message, targetRole, priority, expiresAt }` | `{}` | `application/json` | Available |
| **Delete Announcement** | `DELETE` | `/api/announcements/:id` | `teacher`, `admin` | Params: `id` | `{}` | `application/json` | Available |
| **My Notifications** | `GET` | `/api/notifications` | Authenticated | None | `[ { id, title, message, notification_type, is_read, created_at } ]` | `application/json` | Available |
| **Mark Notification Read** | `PATCH` | `/api/notifications/:id/read` | Authenticated | Params: `id` | `{}` | `application/json` | Available |
| **Mark All Notifications Read** | `PATCH` | `/api/notifications/read-all` | Authenticated | None | `{ count }` | `application/json` | Available |
| **Admin Dashboard Stats** | `GET` | `/api/reports/admin-dashboard` | `admin` | None | `{ counts, todayAttendance, overallAttendancePercentage, lowAttendanceStudents, recentAnnouncements, recentActivities, monthlyAttendanceChart }` | `application/json` | Available |
| **Teacher Dashboard Stats** | `GET` | `/api/reports/teacher-dashboard` | `teacher` | None | `{ assignedClasses, todaySchedule, pendingAttendanceCount, recentAssignments, pendingEvaluationsCount, lowAttendanceStudents }` | `application/json` | Available |
| **Student Dashboard Stats** | `GET` | `/api/reports/student-dashboard` | `student` | None | `{ overallAttendancePercentage, subjectAttendance, pendingAssignments, recentMarks, todaySchedule, announcements, notifications }` | `application/json` | Available |
| **Parent Dashboard Stats** | `GET` | `/api/reports/parent-dashboard` | `parent` | None | `[ { studentId, studentName, overallAttendancePercentage, recentMarks, pendingAssignments, warnings, announcements } ]` | `application/json` | Available |
| **Attendance Report** | `GET` | `/api/reports/attendance` | `teacher`, `admin` | Query: `classId, sectionId, subjectId, startDate, endDate` | `[ { record_id, attendance_date, lecture_number, subject_name, student_name, status } ]` | `application/json` | Available |
| **Performance Risk Report** | `GET` | `/api/reports/performance` | `teacher`, `admin` | Query: `classId` | `[ { studentId, studentName, attendancePercentage, marksPercentage, pendingAssignments, riskAnalysis: { category, reasons } } ]` | `application/json` | Available |
| **Student Performance Analysis** | `GET` | `/api/reports/student-performance/:studentId` | `parent`, `teacher`, `admin` | Params: `studentId` | `{ studentId, subjectMarks, totalMaximumMarks, totalMarksObtained, overallPercentage, overallGrade, subjectAverage, performanceAnalysis }` | `application/json` | Available |

---

## Missing Backend APIs
*None.* All required endpoints exist and are verified.
