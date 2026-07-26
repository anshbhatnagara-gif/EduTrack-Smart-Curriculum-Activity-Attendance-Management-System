USE edutrack_db;

-- Clear tables first to avoid unique key conflicts if running multiple times
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE attendance_warnings;
TRUNCATE TABLE notifications;
TRUNCATE TABLE announcements;
TRUNCATE TABLE timetable_entries;
TRUNCATE TABLE marks;
TRUNCATE TABLE exams;
TRUNCATE TABLE assignment_submissions;
TRUNCATE TABLE assignments;
TRUNCATE TABLE study_materials;
TRUNCATE TABLE attendance_records;
TRUNCATE TABLE attendance_sessions;
TRUNCATE TABLE student_enrollments;
TRUNCATE TABLE teacher_assignments;
TRUNCATE TABLE subjects;
TRUNCATE TABLE sections;
TRUNCATE TABLE classes;
TRUNCATE TABLE parent_student_links;
TRUNCATE TABLE parents;
TRUNCATE TABLE students;
TRUNCATE TABLE teachers;
TRUNCATE TABLE academic_sessions;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Password is 'password123')
INSERT INTO users (id, full_name, email, phone, password_hash, role, status) VALUES
(1, 'EduTrack Admin', 'admin@edutrack.local', '1234567890', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'admin', 'active'),
(2, 'John Doe (Math Teacher)', 'teacher1@edutrack.local', '1234567891', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'teacher', 'active'),
(3, 'Jane Smith (Science Teacher)', 'teacher2@edutrack.local', '1234567892', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'teacher', 'active'),

-- Students
(4, 'Student One', 'student1@edutrack.local', '1111111111', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(5, 'Student Two', 'student2@edutrack.local', '2222222222', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(6, 'Student Three', 'student3@edutrack.local', '3333333333', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(7, 'Student Four', 'student4@edutrack.local', '4444444444', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(8, 'Student Five', 'student5@edutrack.local', '5555555555', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(9, 'Student Six', 'student6@edutrack.local', '6666666666', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(10, 'Student Seven', 'student7@edutrack.local', '7777777777', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(11, 'Student Eight', 'student8@edutrack.local', '8888888888', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(12, 'Student Nine', 'student9@edutrack.local', '9999999999', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),
(13, 'Student Ten', 'student10@edutrack.local', '1010101010', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'student', 'active'),

-- Parents
(14, 'Parent One', 'parent1@edutrack.local', '9876543211', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'parent', 'active'),
(15, 'Parent Two', 'parent2@edutrack.local', '9876543212', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'parent', 'active'),
(16, 'Parent Three', 'parent3@edutrack.local', '9876543213', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'parent', 'active'),
(17, 'Parent Four', 'parent4@edutrack.local', '9876543214', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'parent', 'active'),
(18, 'Parent Five', 'parent5@edutrack.local', '9876543215', '$2a$10$wwy8d6ZwoOuJXwJwuLyvaeJ1EI55RRpzLbx.U3oFyfh/YR8koPuzO', 'parent', 'active');

-- 2. Academic Sessions Table
INSERT INTO academic_sessions (id, name, start_date, end_date, is_active) VALUES
(1, 'Academic Year 2026-2027', '2026-06-01', '2027-04-30', 1);

-- 3. Teachers Table
INSERT INTO teachers (id, user_id, employee_code, qualification, joining_date) VALUES
(1, 2, 'T-1001', 'M.Sc. Mathematics, B.Ed.', '2020-08-15'),
(2, 3, 'T-1002', 'Ph.D. Physics, M.Ed.', '2021-10-10');

-- 4. Students Table
INSERT INTO students (id, user_id, admission_number, roll_number, date_of_birth, gender, admission_date) VALUES
(1, 4, 'S-202601', '1', '2012-04-12', 'Male', '2026-06-01'),
(2, 5, 'S-202602', '2', '2012-05-15', 'Female', '2026-06-01'),
(3, 6, 'S-202603', '3', '2012-06-20', 'Male', '2026-06-01'),
(4, 7, 'S-202604', '4', '2012-07-05', 'Female', '2026-06-01'),
(5, 8, 'S-202605', '5', '2012-08-18', 'Male', '2026-06-01'),
(6, 9, 'S-202606', '1', '2011-09-22', 'Female', '2026-06-01'),
(7, 10, 'S-202607', '2', '2011-10-09', 'Male', '2026-06-01'),
(8, 11, 'S-202608', '3', '2011-11-30', 'Female', '2026-06-01'),
(9, 12, 'S-202609', '4', '2011-12-14', 'Male', '2026-06-01'),
(10, 13, 'S-202610', '5', '2011-01-25', 'Female', '2026-06-01');

-- 5. Parents Table
INSERT INTO parents (id, user_id, occupation, relationship_type) VALUES
(1, 14, 'Software Engineer', 'Father'),
(2, 15, 'Doctor', 'Mother'),
(3, 16, 'Business Owner', 'Father'),
(4, 17, 'Teacher', 'Mother'),
(5, 18, 'Architect', 'Father');

-- 6. Parent Student Links Table (Link 1 parent to 2 children)
INSERT INTO parent_student_links (parent_id, student_id, relationship, is_primary) VALUES
(1, 1, 'Father', 1),
(1, 2, 'Father', 1),
(2, 3, 'Mother', 1),
(2, 4, 'Mother', 1),
(3, 5, 'Father', 1),
(3, 6, 'Father', 1),
(4, 7, 'Mother', 1),
(4, 8, 'Mother', 1),
(5, 9, 'Father', 1),
(5, 10, 'Father', 1);

-- 7. Classes Table
INSERT INTO classes (id, name, numeric_level, academic_session_id, status) VALUES
(1, 'Grade 9', 9, 1, 'active'),
(2, 'Grade 10', 10, 1, 'active');

-- 8. Sections Table
INSERT INTO sections (id, class_id, name, room_number, capacity) VALUES
(1, 1, 'A', 'Room 101', 30),
(2, 2, 'A', 'Room 102', 30);

-- 9. Subjects Table
INSERT INTO subjects (id, subject_code, name, description) VALUES
(1, 'SUB-MTH9', 'Mathematics 9', 'Algebra, Geometry and Mensuration'),
(2, 'SUB-SCI9', 'Science 9', 'Basics of Physics, Chemistry and Biology'),
(3, 'SUB-ENG9', 'English 9', 'English Grammar and Literature'),
(4, 'SUB-MTH10', 'Mathematics 10', 'Trigonometry, Statistics and Probability'),
(5, 'SUB-SCI10', 'Science 10', 'Carbon Compounds, Electricity and Heredity');

-- 10. Teacher Assignments Table
INSERT INTO teacher_assignments (id, teacher_id, class_id, section_id, subject_id, academic_session_id) VALUES
(1, 1, 1, 1, 1, 1), -- John Doe teaches Math 9 to Grade 9 A
(2, 1, 2, 1, 4, 1), -- John Doe teaches Math 10 to Grade 10 A
(3, 2, 1, 1, 2, 1), -- Jane Smith teaches Science 9 to Grade 9 A
(4, 2, 2, 1, 5, 1); -- Jane Smith teaches Science 10 to Grade 10 A

-- 11. Student Enrollments Table
INSERT INTO student_enrollments (id, student_id, class_id, section_id, academic_session_id, roll_number, enrollment_status) VALUES
(1, 1, 1, 1, 1, '1', 'active'),
(2, 2, 1, 1, 1, '2', 'active'),
(3, 3, 1, 1, 1, '3', 'active'),
(4, 4, 1, 1, 1, '4', 'active'),
(5, 5, 1, 1, 1, '5', 'active'),
(6, 6, 2, 1, 1, '1', 'active'),
(7, 7, 2, 1, 1, '2', 'active'),
(8, 8, 2, 1, 1, '3', 'active'),
(9, 9, 2, 1, 1, '4', 'active'),
(10, 10, 2, 1, 1, '5', 'active');

-- 12. Attendance Sessions Table
INSERT INTO attendance_sessions (id, class_id, section_id, subject_id, teacher_id, academic_session_id, attendance_date, lecture_number, start_time, end_time, status) VALUES
(1, 1, 1, 1, 1, 1, '2026-07-26', 1, '09:00:00', '10:00:00', 'completed'),
(2, 1, 1, 2, 2, 1, '2026-07-26', 2, '10:00:00', '11:00:00', 'completed');

-- 13. Attendance Records Table
INSERT INTO attendance_records (id, attendance_session_id, student_id, status, remarks, marked_by) VALUES
-- Session 1 (Math 9 - John Doe)
(1, 1, 1, 'present', NULL, 2),
(2, 1, 2, 'present', NULL, 2),
(3, 1, 3, 'absent', 'Unexcused absence', 2),
(4, 1, 4, 'present', NULL, 2),
(5, 1, 5, 'late', 'Arrived 15m late', 2),
-- Session 2 (Science 9 - Jane Smith)
(6, 2, 1, 'present', NULL, 3),
(7, 2, 2, 'leave', 'Medical emergency leave', 3),
(8, 2, 3, 'present', NULL, 3),
(9, 2, 4, 'present', NULL, 3),
(10, 2, 5, 'present', NULL, 3);

-- 14. Study Materials Table
INSERT INTO study_materials (id, teacher_id, class_id, section_id, subject_id, title, description, material_type, file_path, external_url, unit_name, topic_name) VALUES
(1, 1, 1, 1, 1, 'Unit 1: Number Systems', 'Notes on Real Numbers and Rationalization', 'pdf', 'uploads/materials/unit1_real_numbers.pdf', NULL, 'Unit 1', 'Number Systems'),
(2, 2, 1, 1, 2, 'Introduction to Chemistry Basics', 'Useful revision video link', 'video_link', NULL, 'https://www.youtube.com/watch?v=example', 'Unit 1', 'Matter in Our Surroundings');

-- 15. Assignments Table
INSERT INTO assignments (id, teacher_id, class_id, section_id, subject_id, title, description, attachment_path, due_date, maximum_marks, status) VALUES
(1, 1, 1, 1, 1, 'Algebra Assignment 1', 'Solve exercises 2.1 to 2.4 in the notebook.', NULL, '2026-08-05 23:59:00', 20.00, 'active'),
(2, 2, 1, 1, 2, 'Force and Laws of Motion Worksheet', 'Complete the worksheet and upload the PDF file.', NULL, '2026-08-08 18:00:00', 50.00, 'active');

-- 16. Assignment Submissions Table
INSERT INTO assignment_submissions (id, assignment_id, student_id, submission_text, file_path, submitted_at, submission_status, marks_obtained, teacher_feedback, evaluated_by, evaluated_at) VALUES
(1, 1, 1, 'Completed algebra problems.', 'uploads/submissions/sub_algebra_student1.pdf', '2026-07-26 12:00:00', 'evaluated', 18.00, 'Excellent work! Keep it up.', 1, '2026-07-26 15:00:00'),
(2, 1, 2, 'Attached is my submission.', 'uploads/submissions/sub_algebra_student2.pdf', '2026-07-26 14:30:00', 'submitted', NULL, NULL, NULL, NULL);

-- 17. Exams Table
INSERT INTO exams (id, name, exam_type, academic_session_id, start_date, end_date, status) VALUES
(1, 'First Term Examination 2026', 'midterm', 1, '2026-09-10', '2026-09-20', 'scheduled');

-- 18. Marks Table
INSERT INTO marks (id, exam_id, student_id, class_id, section_id, subject_id, teacher_id, maximum_marks, marks_obtained, grade, remarks) VALUES
(1, 1, 1, 1, 1, 1, 1, 100.00, 92.50, 'A+', 'Outstanding performance in Mathematics'),
(2, 1, 2, 1, 1, 1, 1, 100.00, 75.00, 'B+', 'Good, but has scope for improvement in geometry');

-- 19. Timetable Entries Table
INSERT INTO timetable_entries (id, academic_session_id, class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number) VALUES
(1, 1, 1, 1, 1, 1, 'Monday', '09:00:00', '10:00:00', 'Room 101'), -- Mon 9:00 Math 9
(2, 1, 1, 1, 2, 2, 'Monday', '10:00:00', '11:00:00', 'Room 101'), -- Mon 10:00 Sci 9
(3, 1, 2, 1, 4, 1, 'Monday', '11:15:00', '12:15:00', 'Room 102'), -- Mon 11:15 Math 10
(4, 1, 2, 1, 5, 2, 'Monday', '12:15:00', '13:15:00', 'Room 102'); -- Mon 12:15 Sci 10

-- 20. Announcements Table
INSERT INTO announcements (id, created_by, title, message, target_role, priority) VALUES
(1, 1, 'School Reopening Date', 'The school will reopen for the new academic session on June 1st.', 'all', 'high'),
(2, 2, 'Math Quiz Postponed', 'The Mathematics quiz scheduled for tomorrow is postponed to next Monday.', 'student', 'medium');
