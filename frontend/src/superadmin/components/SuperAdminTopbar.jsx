import React, { useState } from 'react';
import { Menu, TrendingUp, Plus, User, Bell, CheckCircle2, Zap, CreditCard, X } from 'lucide-react';
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext';
import { useSuperAdminData } from '../context/SuperAdminDataContext';
import { useNavigate } from 'react-router-dom';

export const SuperAdminTopbar = ({ onOpenMobileMenu }) => {
  const { currentSuperAdmin } = useSuperAdminAuth();
  const { metrics, invoices, markInvoicePaid } = useSuperAdminData();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs transition-all">
      {/* Left: Mobile Toggle & Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
            Multi-Tenant Network Online
          </span>
          <span className="text-xs font-bold text-emerald-800 hidden md:inline px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            {metrics.activeTenantsCount} Active {metrics.activeTenantsCount === 1 ? 'Restaurant' : 'Restaurants'}
          </span>
        </div>
      </div>

      {/* Right: Quick MRR Metric, Notifications & Actions */}
      <div className="flex items-center gap-3">
        {/* MRR Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-extrabold shadow-2xs">
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          <span>MRR: ₹{metrics.mrr.toLocaleString()}</span>
        </div>

        {/* 🔔 Notification Bell Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Payment Notifications"
          >
            <Bell className="w-5 h-5" />
            {pendingInvoices.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {pendingInvoices.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popup */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 animate-fade-in text-slate-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Recharge Payment Notifications
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                {pendingInvoices.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                    <p className="font-semibold text-slate-600">No pending recharge payments</p>
                    <p className="text-[11px] text-slate-400">All admin payments have been verified</p>
                  </div>
                ) : (
                  pendingInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-extrabold text-slate-900">
                            {inv.restaurantName}
                          </p>
                          <p className="text-[11px] text-amber-900 font-medium">
                            Paid for <span className="font-bold text-slate-900">{inv.requestedPlanName || inv.planName || 'Plan Upgrade'}</span>
                          </p>
                        </div>
                        <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                          ₹{inv.total?.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-mono pt-1 border-t border-amber-200/60">
                        <span>UTR: <strong>{inv.utrNumber || 'N/A'}</strong></span>
                        <span>{inv.issuedDate}</span>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          await markInvoicePaid(inv.id);
                        }}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Approve & Activate Plan</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {pendingInvoices.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/superadmin/invoices');
                    }}
                    className="text-[11px] text-amber-700 font-bold hover:text-amber-900 cursor-pointer"
                  >
                    View All Invoices & Payments →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Add Client Button */}
        <button
          onClick={() => navigate('/superadmin/restaurants?new=true')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Onboard Restaurant</span>
        </button>

        {/* SuperAdmin Profile Info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">
              {currentSuperAdmin?.name || 'Progix Technology'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Platform SuperAdmin
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
