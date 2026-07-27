import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import RoleRoute from './RoleRoute';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import StudentLayout from '../layouts/StudentLayout';
import ParentLayout from '../layouts/ParentLayout';

// Common Pages
import Login from '../pages/auth/Login';
import Profile from '../pages/common/Profile';
import ChangePassword from '../pages/common/ChangePassword';
import Unauthorized from '../pages/common/Unauthorized';
import NotFound from '../pages/common/NotFound';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import Teachers from '../pages/admin/Teachers';
import Students from '../pages/admin/Students';
import Parents from '../pages/admin/Parents';
import AcademicSessions from '../pages/admin/AcademicSessions';
import ClassesSections from '../pages/admin/ClassesSections';
import Subjects from '../pages/admin/Subjects';
import TeacherAssignments from '../pages/admin/TeacherAssignments';
import StudentEnrollments from '../pages/admin/StudentEnrollments';
import AdminTimetable from '../pages/admin/AdminTimetable';
import AdminAnnouncements from '../pages/admin/AdminAnnouncements';
import AdminReports from '../pages/admin/AdminReports';

// Teacher Pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import AssignedClasses from '../pages/teacher/AssignedClasses';
import ManualAttendance from '../pages/teacher/ManualAttendance';
import AttendanceHistory from '../pages/teacher/AttendanceHistory';
import TeacherMaterials from '../pages/teacher/TeacherMaterials';
import TeacherAssignmentsList from '../pages/teacher/TeacherAssignments';
import TeacherSubmissions from '../pages/teacher/TeacherSubmissions';
import TeacherMarks from '../pages/teacher/TeacherMarks';
import TeacherTimetable from '../pages/teacher/TeacherTimetable';
import TeacherAnnouncements from '../pages/teacher/TeacherAnnouncements';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentAttendance from '../pages/student/StudentAttendance';
import StudentMaterials from '../pages/student/StudentMaterials';
import StudentAssignments from '../pages/student/StudentAssignments';
import StudentSubmissions from '../pages/student/StudentSubmissions';
import StudentMarks from '../pages/student/StudentMarks';
import StudentTimetable from '../pages/student/StudentTimetable';
import StudentAnnouncements from '../pages/student/StudentAnnouncements';
import StudentNotifications from '../pages/student/StudentNotifications';
import StudentProfile from '../pages/student/StudentProfile';

// Parent Pages
import ParentDashboard from '../pages/parent/ParentDashboard';
import ParentChildren from '../pages/parent/ParentChildren';
import ChildAttendance from '../pages/parent/ChildAttendance';
import ChildAssignments from '../pages/parent/ChildAssignments';
import ChildMarks from '../pages/parent/ChildMarks';
import ChildTimetable from '../pages/parent/ChildTimetable';
import ParentAnnouncements from '../pages/parent/ParentAnnouncements';
import ParentNotifications from '../pages/parent/ParentNotifications';
import ParentProfile from '../pages/parent/ParentProfile';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Only Auth Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Admin Portal */}
        <Route element={<RoleRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/teachers" element={<Teachers />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/parents" element={<Parents />} />
            <Route path="/admin/academic/sessions" element={<AcademicSessions />} />
            <Route path="/admin/academic/classes" element={<ClassesSections />} />
            <Route path="/admin/academic/sections" element={<ClassesSections />} />
            <Route path="/admin/academic/subjects" element={<Subjects />} />
            <Route path="/admin/academic/assignments" element={<TeacherAssignments />} />
            <Route path="/admin/academic/enrollments" element={<StudentEnrollments />} />
            <Route path="/admin/timetable" element={<AdminTimetable />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
        </Route>

        {/* Teacher Portal */}
        <Route element={<RoleRoute allowedRoles={['teacher']} />}>
          <Route element={<TeacherLayout />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<AssignedClasses />} />
            <Route path="/teacher/attendance/mark" element={<ManualAttendance />} />
            <Route path="/teacher/attendance/history" element={<AttendanceHistory />} />
            <Route path="/teacher/materials" element={<TeacherMaterials />} />
            <Route path="/teacher/assignments" element={<TeacherAssignmentsList />} />
            <Route path="/teacher/submissions" element={<TeacherSubmissions />} />
            <Route path="/teacher/marks" element={<TeacherMarks />} />
            <Route path="/teacher/timetable" element={<TeacherTimetable />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
          </Route>
        </Route>

        {/* Student Portal */}
        <Route element={<RoleRoute allowedRoles={['student']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/materials" element={<StudentMaterials />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/submissions" element={<StudentSubmissions />} />
            <Route path="/student/marks" element={<StudentMarks />} />
            <Route path="/student/timetable" element={<StudentTimetable />} />
            <Route path="/student/announcements" element={<StudentAnnouncements />} />
            <Route path="/student/notifications" element={<StudentNotifications />} />
            <Route path="/student/profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* Parent Portal */}
        <Route element={<RoleRoute allowedRoles={['parent']} />}>
          <Route element={<ParentLayout />}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/children" element={<ParentChildren />} />
            <Route path="/parent/child-attendance" element={<ChildAttendance />} />
            <Route path="/parent/child-assignments" border-color="gray" element={<ChildAssignments />} />
            <Route path="/parent/child-marks" element={<ChildMarks />} />
            <Route path="/parent/child-timetable" element={<ChildTimetable />} />
            <Route path="/parent/announcements" element={<ParentAnnouncements />} />
            <Route path="/parent/notifications" element={<ParentNotifications />} />
            <Route path="/parent/profile" element={<ParentProfile />} />
          </Route>
        </Route>

        {/* Shared Common Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>

      {/* Utility Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
