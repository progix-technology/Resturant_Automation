import React from 'react';
import { Menu, TrendingUp, Plus, User } from 'lucide-react';
import { useSuperAdminAuth } from '../context/SuperAdminAuthContext';
import { useSuperAdminData } from '../context/SuperAdminDataContext';
import { useNavigate } from 'react-router-dom';

export const SuperAdminTopbar = ({ onOpenMobileMenu }) => {
  const { currentSuperAdmin } = useSuperAdminAuth();
  const { metrics } = useSuperAdminData();
  const navigate = useNavigate();

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

      {/* Right: Quick MRR Metric & Actions */}
      <div className="flex items-center gap-3">
        {/* MRR Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-extrabold shadow-2xs">
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          <span>MRR: ₹{metrics.mrr.toLocaleString()}</span>
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
