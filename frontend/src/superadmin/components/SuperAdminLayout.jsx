import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminTopbar } from './SuperAdminTopbar';
import { useSuperAdminData } from '../context/SuperAdminDataContext';
import { Toast } from '../../components/common/Toast';

export const SuperAdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { toast } = useSuperAdminData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Sidebar */}
      <SuperAdminSidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Pane */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <SuperAdminTopbar onOpenMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type || 'success'}
          onClose={() => {}}
        />
      )}
    </div>
  );
};
