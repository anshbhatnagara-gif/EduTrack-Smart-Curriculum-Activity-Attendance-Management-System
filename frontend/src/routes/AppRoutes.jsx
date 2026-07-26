import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicOnlyRoute from './PublicOnlyRoute';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import StudentLayout from '../layouts/StudentLayout';
import ParentLayout from '../layouts/ParentLayout';

// Auth Pages
import Login from '../pages/auth/Login';

// Common Pages
import Profile from '../pages/common/Profile';
import ChangePassword from '../pages/common/ChangePassword';
import Unauthorized from '../pages/common/Unauthorized';
import NotFound from '../pages/common/NotFound';

// Role Dashboards
import AdminDashboard from '../pages/admin/AdminDashboard';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
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
          </Route>
        </Route>

        {/* Teacher Portal */}
        <Route element={<RoleRoute allowedRoles={['teacher']} />}>
          <Route element={<TeacherLayout />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
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

        {/* Common Protected Pages (accessible by any logged in role) */}
        <Route element={<AdminLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      {/* Error & Fallback Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
