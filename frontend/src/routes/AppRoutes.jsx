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

// Student & Parent Dashboards
import StudentDashboard from '../pages/student/StudentDashboard';
import ParentDashboard from '../pages/parent/ParentDashboard';

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
          </Route>
        </Route>

        {/* Parent Portal */}
        <Route element={<RoleRoute allowedRoles={['parent']} />}>
          <Route element={<ParentLayout />}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
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
