import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/feedback/LoadingScreen';

const RoleRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Checking permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role?.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

  if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
