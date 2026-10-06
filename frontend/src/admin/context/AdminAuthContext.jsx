import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthService } from '../services/adminAuthService';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [currentAdmin, setCurrentAdmin] = useState(() => {
    const admin = adminAuthService.getCurrentAdmin();
    if (admin) {
      return {
        ...admin,
        role: admin.role === 'SUPER_ADMIN' ? 'ADMIN' : (admin.role || 'ADMIN'),
        avatar: '',
      };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const session = await adminAuthService.loginAdmin(email, password);
      setCurrentAdmin(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    adminAuthService.logoutAdmin();
    setCurrentAdmin(null);
  };

  const hasPermission = (moduleName) => {
    if (!currentAdmin) return false;
    if (
      currentAdmin.role === 'ADMIN' || 
      currentAdmin.role === 'SUPER_ADMIN' ||
      currentAdmin.role === 'OWNER'
    ) {
      return true;
    }
    return adminAuthService.hasPermission(currentAdmin.role, moduleName);
  };


  const isAuthenticated = Boolean(currentAdmin && currentAdmin.id);

  return (
    <AdminAuthContext.Provider
      value={{
        currentAdmin,
        isAuthenticated,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
