import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext';

export const SuperAdminProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSuperAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/superadmin/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};
