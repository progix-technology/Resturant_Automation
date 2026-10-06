import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

/**
 * Frontend Route Protection Guard
 * 
 * NOTE: Frontend route protection is a UX convenience and not real security.
 * Production authentication and authorization MUST be enforced by the backend/API
 * through secure HTTP-only cookies, JWT verification, and server-side RBAC.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve requested path for redirection after successful login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};
