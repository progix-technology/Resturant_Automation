import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, Zap, X, Check, Lock, ArrowUpRight, PhoneCall } from 'lucide-react';

export const PlanUpgradeModal = ({
  isOpen,
  onClose,
  title = 'Plan Limit Exceeded',
  featureName = 'Feature',
  currentPlan = 'Starter QR',
  limitText = '',
  message = 'Please purchase this plan to perform this action.',
}) => {
  if (!isOpen) return null;

  const plansComparison = [
    {
      name: 'Starter QR',
      price: '₹999/mo',
      badge: 'Current Plan',
      tables: '10 Tables',
      dishes: '30 Dishes',
      admins: '1 Admin Login',
      staff: '0 Staff Accounts',
      analytics: 'Disabled',
      color: 'border-slate-200 bg-slate-50',
    },
    {
      name: 'Growth Pro',
      price: '₹2,499/mo',
      badge: 'Recommended',
      tables: '30 Tables',
      dishes: '60 Dishes',
      admins: '4 Admin Logins',
      staff: '4 Staff Accounts',
      analytics: 'Basic Reports',
      color: 'border-indigo-300 bg-indigo-50/50 shadow-sm',
    },
    {
      name: 'Enterprise Scale',
      price: '₹4,999/mo',
      badge: 'High Volume',
      tables: '50 Tables',
      dishes: '100+ Dishes',
      admins: '8 Admin Logins',
      staff: '8 Staff Accounts',
      analytics: 'Full Analytics & CRM',
      color: 'border-emerald-300 bg-emerald-50/50 shadow-sm',
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dark backdrop blur overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 animate-fade-in my-auto overflow-hidden"
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold tracking-wide uppercase mb-1">
              <Lock className="w-3 h-3" />
              <span>Subscription Limit Reached</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            {limitText && (
              <p className="text-xs font-semibold text-slate-600 mt-0.5">{limitText}</p>
            )}
          </div>
        </div>

        {/* Highlighted Warning Alert Box */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 text-slate-900">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
            <p className="text-sm font-bold text-amber-950">
              {message}
            </p>
          </div>
        </div>

        {/* Tier Limits Comparison Breakdown */}
        <div className="mt-5 space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Available Plans & Features
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plansComparison.map((plan) => {
              const isCurrent = currentPlan.toLowerCase().includes(plan.name.toLowerCase().split(' ')[0]);
              return (
                <div
                  key={plan.name}
                  className={`p-3.5 rounded-2xl border transition-all ${plan.color} relative flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-extrabold text-slate-900">{plan.name}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                        {plan.price}
                      </span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1 mt-2.5">
                      <li className="flex items-center gap-1.5 font-medium">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{plan.tables}</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-medium">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{plan.dishes}</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-medium">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{plan.admins}</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-medium">
                        {plan.staff.startsWith('0') ? (
                          <X className="w-3 h-3 text-rose-500 shrink-0" />
                        ) : (
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        )}
                        <span>{plan.staff}</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-medium">
                        {plan.analytics === 'Disabled' ? (
                          <X className="w-3 h-3 text-rose-500 shrink-0" />
                        ) : (
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        )}
                        <span>{plan.analytics}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 text-center sm:text-left">
            Need higher limits? SuperAdmin can upgrade your plan instantly.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto"
            >
              Cancel
            </button>
            <a
              href="tel:+919876543210"
              onClick={() => {
                alert('Please request SuperAdmin to upgrade your plan validity and package limits from the SuperAdmin Portal.');
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Contact SuperAdmin to Upgrade</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
