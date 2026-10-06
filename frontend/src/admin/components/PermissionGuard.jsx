import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export const PermissionGuard = ({ module, children }) => {
  const { hasPermission, currentAdmin } = useAdminAuth();
  const navigate = useNavigate();

  if (!hasPermission(module)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            403 — Access Restricted
          </h2>

          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Your current role (<strong className="text-slate-800 font-semibold">{currentAdmin?.role || 'User'}</strong>) does not have authorization to access the <span className="font-semibold text-slate-800 capitalize">"{module}"</span> module.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Home className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};
