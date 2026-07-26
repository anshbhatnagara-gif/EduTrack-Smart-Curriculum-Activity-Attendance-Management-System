import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/feedback/LoadingScreen';

const PublicOnlyRoute = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Verifying session..." />;
  }

  if (isAuthenticated && user) {
    const role = user.role?.toLowerCase();
    switch (role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      case 'parent':
        return <Navigate to="/parent/dashboard" replace />;
      default:
        return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
