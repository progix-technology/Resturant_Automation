import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Armchair,
  UtensilsCrossed,
  Users,
  BellRing,
  UserCheck,
  CreditCard,
  BarChart3,
  Sliders,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ExternalLink,
  Sparkles,
  User,
  Zap,
  Check,
  CheckCircle2,
  Crown,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminData } from '../context/AdminDataContext';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { mockPricingPlans } from '../../superadmin/data/mockSuperAdminData';

export const AdminSidebar = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { currentAdmin, logout, hasPermission } = useAdminAuth();
  const { settings, stats, showToast } = useAdminData();
  const navigate = useNavigate();
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [planModalTab, setPlanModalTab] = useState('CURRENT');

  const [activePlanId, setActivePlanId] = useState(() => {
    return storage.get(STORAGE_KEYS.RESTAURANT_ACTIVE_SAAS_PLAN, 'plan-growth');
  });

  const availablePlans = storage.get(STORAGE_KEYS.SUPERADMIN_PLANS, mockPricingPlans) || mockPricingPlans;
  const activePlan = availablePlans.find((p) => p.id === activePlanId) || availablePlans[1] || mockPricingPlans[1];

  const handleSwitchPlan = (plan) => {
    setActivePlanId(plan.id);
    storage.set(STORAGE_KEYS.RESTAURANT_ACTIVE_SAAS_PLAN, plan.id);
    if (showToast) {
      showToast(`SaaS Subscription updated to ${plan.name} (₹${plan.monthlyPrice?.toLocaleString()}/mo)!`, 'success');
    }
    setPlanModalTab('CURRENT');
  };

  const logoUrl = settings?.logo || settings?.profile?.logo || settings?.logoUrl;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { key: 'orders', label: 'Orders', path: '/admin/orders', icon: ShoppingBag, badge: stats?.activeOrdersCount || null, badgeColor: 'bg-amber-500' },
    { key: 'tables', label: 'Tables', path: '/admin/tables', icon: Armchair },
    { key: 'menu', label: 'Menu Catalog', path: '/admin/menu', icon: UtensilsCrossed },
    { key: 'customers', label: 'Customers', path: '/admin/customers', icon: Users },
    { key: 'notifications', label: 'Notifications', path: '/admin/notifications', icon: BellRing },
    { key: 'staff', label: 'Staff Roster', path: '/admin/staff', icon: UserCheck },
    { key: 'payments', label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { key: 'reports', label: 'Analytics', path: '/admin/reports', icon: BarChart3 },
    { key: 'settings', label: 'Settings', path: '/admin/settings', icon: Sliders },
  ];

  const visibleNavItems = navItems.filter((item) => hasPermission(item.key));

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container - Light White & Light Yellow theme */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 bg-white text-slate-700 flex flex-col border-r border-amber-100 shadow-sm transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Header Branding */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-amber-100 shrink-0 bg-amber-50/30">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={settings?.profile?.name || 'Restaurant Logo'}
                className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-sm border border-amber-200 bg-white"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                SG
              </div>
            )}
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <h1 className="text-sm font-extrabold text-slate-900 truncate leading-tight">
                  {settings?.profile?.name || 'Spice Garden'}
                </h1>
                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                  Restaurant Admin
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-amber-100/50"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.key}
                to={item.path}
                end={item.exact}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group
                  ${isActive
                    ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-amber-950 hover:bg-amber-50/50'
                  }
                  ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105 text-amber-600" />
                {(!isCollapsed || isMobileOpen) && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {(!isCollapsed || isMobileOpen) && item.badge && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900 bg-amber-400 shrink-0 shadow-xs"
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Active Subscription Plan Card */}
        {(!isCollapsed || isMobileOpen) ? (
          <div
            onClick={() => {
              setPlanModalTab('CURRENT');
              setShowPlanDetails(true);
            }}
            className="mx-3 my-2 p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-yellow-500/10 border border-amber-200/80 shadow-2xs space-y-2 cursor-pointer hover:border-amber-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>{activePlan.name}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
              <span>Billing Cycle</span>
              <span className="font-bold text-slate-900">₹{activePlan.monthlyPrice?.toLocaleString()} / mo</span>
            </div>
            <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Limit: {activePlan.maxTables || 40} Tables</span>
              <span className="text-amber-800 font-bold group-hover:text-amber-950 group-hover:underline flex items-center gap-0.5">
                Available Plans →
              </span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              setPlanModalTab('CURRENT');
              setShowPlanDetails(true);
            }}
            className="my-2 flex justify-center cursor-pointer"
            title={`Active Subscription: ${activePlan.name} (₹${activePlan.monthlyPrice}/mo)`}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shadow-2xs hover:bg-amber-100 transition-colors">
              <Zap className="w-4 h-4 fill-amber-400 text-amber-600" />
            </div>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2 border-t border-amber-100 bg-amber-50/20">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 hover:text-amber-900 hover:bg-amber-100/50 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>

        {/* Footer Admin Profile & Logout */}
        <div className="p-3 border-t border-amber-100 bg-amber-50/40">
          <div className={`flex items-center gap-3 ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0 shadow-2xs">
              <User className="w-4 h-4 text-amber-800" />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentAdmin?.name || 'Restaurant Admin'}
                </p>
                <p className="text-[10px] text-amber-800 font-bold uppercase truncate">
                  {currentAdmin?.role === 'SUPER_ADMIN' ? 'ADMIN' : (currentAdmin?.role || 'ADMIN')}
                </p>
              </div>
            )}

            {(!isCollapsed || isMobileOpen) && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {isCollapsed && !isMobileOpen && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Active SaaS Plan & SuperAdmin Upgrade Modal ────────────────────── */}
      {showPlanDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className={`bg-white rounded-3xl ${planModalTab === 'CATALOG' ? 'max-w-2xl' : 'max-w-md'} w-full p-6 shadow-2xl border border-amber-200 relative space-y-5 my-8 transition-all duration-300`}>

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
                  <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {planModalTab === 'CATALOG' ? 'Available SaaS Plans' : activePlan.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {planModalTab === 'CATALOG'
                      ? 'Select or upgrade your restaurant SaaS subscription tier'
                      : 'Active SaaS License & Plan Features'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPlanDetails(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Switcher Tabs */}
            <div className="flex items-center p-1 bg-amber-50/70 rounded-xl border border-amber-200/60">
              <button
                type="button"
                onClick={() => setPlanModalTab('CURRENT')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all ${planModalTab === 'CURRENT'
                    ? 'bg-white text-slate-900 shadow-xs border border-amber-200'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Current Active Plan
              </button>
              <button
                type="button"
                onClick={() => setPlanModalTab('CATALOG')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${planModalTab === 'CATALOG'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-900 hover:text-amber-950'
                  }`}
              >
                <Crown className="w-3.5 h-3.5" />
                Available Plans ({availablePlans.length})
              </button>
            </div>

            {/* TAB 1: CURRENT PLAN DETAILS */}
            {planModalTab === 'CURRENT' && (
              <div className="space-y-4">
                {/* Active Plan Info Card */}
                <div className="bg-gradient-to-br from-amber-50/90 to-yellow-50/40 rounded-2xl p-4 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold text-xs">Subscription Plan</span>
                    <span className="font-extrabold text-amber-950 text-sm">{activePlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Monthly Subscription Fee</span>
                    <span className="font-black text-slate-900 text-sm">₹{activePlan.monthlyPrice?.toLocaleString()} / Month</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Table QR Code Limit</span>
                    <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/50">
                      Up to {activePlan.maxTables || 40} Tables
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Order Volume</span>
                    <span className="font-bold text-slate-800">{activePlan.maxOrdersPerMonth}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Billing Cycle & Renewal</span>
                    <span className="font-bold text-emerald-700">Monthly Auto-Debit (15th Oct)</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Included Plan Features</p>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {(activePlan.features || [
                      'Unlimited Monthly Diner Orders (0% Commission)',
                      'Live Kitchen Order Management & ETA Tracking',
                      'Automated WhatsApp Notification Alerts',
                      'Priority WhatsApp & Call Support'
                    ]).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-[10px] shrink-0">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: SUPERADMIN PLANS CATALOG */}
            {planModalTab === 'CATALOG' && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {availablePlans.map((plan) => {
                    const isSelected = plan.id === activePlan.id;

                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${isSelected
                            ? 'bg-amber-50/80 border-amber-400 shadow-md ring-2 ring-amber-400/20'
                            : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm'
                          }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900">{plan.name}</h4>
                              {plan.badge && (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                                  {plan.badge}
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                          </div>

                          <div>
                            <div className="text-lg font-black text-slate-900">
                              ₹{plan.monthlyPrice?.toLocaleString()}
                              <span className="text-xs font-semibold text-slate-500"> / mo</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1 line-clamp-2">
                              {plan.tagline}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                            <div className="flex items-center justify-between font-semibold">
                              <span>Tables:</span>
                              <span className="font-bold text-slate-900">{plan.maxTables} Tables</span>
                            </div>
                            <div className="flex items-center justify-between font-semibold">
                              <span>Orders:</span>
                              <span className="font-bold text-slate-900">{plan.maxOrdersPerMonth}</span>
                            </div>
                          </div>

                          <div className="space-y-1 pt-1">
                            {plan.features?.slice(0, 4).map((f, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4">
                          {isSelected ? (
                            <button
                              type="button"
                              disabled
                              className="w-full py-2 px-3 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs text-center border border-emerald-300 cursor-default"
                            >
                              Active Plan ✓
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSwitchPlan(plan)}
                              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs text-center shadow-xs transition-colors cursor-pointer"
                            >
                              Select / Upgrade Plan
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              {planModalTab === 'CURRENT' ? (
                <button
                  type="button"
                  onClick={() => setPlanModalTab('CATALOG')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-extrabold text-xs shadow-sm transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-4 h-4" />
                  <span>View All Available Plans ({availablePlans.length})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPlanModalTab('CURRENT')}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors text-center cursor-pointer"
                >
                  ← Back to Active Plan
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowPlanDetails(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors text-center cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

