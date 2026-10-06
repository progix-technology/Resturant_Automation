import React, { createContext, useContext, useState } from 'react';
import { superAdminAuthService } from '../services/superAdminAuthService';

const SuperAdminAuthContext = createContext(null);

export const SuperAdminAuthProvider = ({ children }) => {
  const [currentSuperAdmin, setCurrentSuperAdmin] = useState(() => {
    return superAdminAuthService.getCurrentSession();
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const session = await superAdminAuthService.login(email, password);
      setCurrentSuperAdmin(session);
      return session;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    superAdminAuthService.logout();
    setCurrentSuperAdmin(null);
  };

  const isAuthenticated = Boolean(
    currentSuperAdmin &&
    currentSuperAdmin.id &&
    currentSuperAdmin.role === 'PLATFORM_SUPERADMIN'
  );

  return (
    <SuperAdminAuthContext.Provider
      value={{
        currentSuperAdmin,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </SuperAdminAuthContext.Provider>
  );
};

export const useSuperAdminAuth = () => {
  const context = useContext(SuperAdminAuthContext);
  if (!context) {
    throw new Error('useSuperAdminAuth must be used within a SuperAdminAuthProvider');
  }
  return context;
};
