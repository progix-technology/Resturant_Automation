import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  PackageCheck,
  CreditCard,
  FileSpreadsheet,
  TrendingUp,
  Sliders,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  User,
} from 'lucide-react';
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext';

export const SuperAdminSidebar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentSuperAdmin, logout } = useSuperAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/superadmin/login');
  };

  const navItems = [
    { to: '/superadmin', label: 'Platform HQ', icon: LayoutDashboard, end: true },
    { to: '/superadmin/restaurants', label: 'Restaurant Tenants', icon: Building2 },
    { to: '/superadmin/plans', label: 'Pricing & Packaging', icon: PackageCheck },
    { to: '/superadmin/subscriptions', label: 'Subscriptions', icon: Zap },
    { to: '/superadmin/invoices', label: 'Billing & Invoices', icon: CreditCard },
    { to: '/superadmin/analytics', label: 'Growth Analytics', icon: TrendingUp },
    { to: '/superadmin/settings', label: 'Platform Settings', icon: Sliders },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar Shell - Clean Light White & Sleek Slate */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 shadow-2xs transition-all duration-300 ease-in-out text-slate-700 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-sm shadow-xs border border-slate-800 shrink-0">
              OF
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-none flex items-center gap-1.5">
                  OrderFlow <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 font-bold border border-amber-200">HQ</span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold truncate mt-1">
                  Progix SuperAdmin
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SaaS Monetization & Operations
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-700'
                    }`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Quick jump to Client Portals */}
          {!isCollapsed && (
            <div className="pt-6 pb-2">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Client Preview
              </p>
              <div className="space-y-1">
                <a
                  href="/admin"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Restaurant Admin
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <a
                  href="/menu/spice-garden"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Customer QR Menu
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer User & Logout */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2 py-1.5'}`}>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate leading-none">
                  {currentSuperAdmin?.name || 'Progix Technology'}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-semibold mt-0.5">
                  Platform SuperAdmin
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sign out of HQ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign out of HQ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
