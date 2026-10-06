import React, { useState } from 'react';
import {
  Zap,
  Calendar,
  Building2,
  Search,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminSubscriptionsPage = () => {
  const { tenants, plans, toggleTenantStatus, generateInvoice, showToast } = useSuperAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('ALL');

  const filteredTenants = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCycle = cycleFilter === 'ALL' || t.billingCycle === cycleFilter;
    return matchSearch && matchCycle;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          Subscription Lifecycles & Renewals
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Monitor auto-debit cycles, trial conversions, and upcoming packaging fee collections.
        </p>
      </div>

      {/* Filter bar - Light White & Light Yellow */}
      <div className="bg-white border border-amber-100 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="w-4 h-4 text-amber-700 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tenant or owner..."
            className="w-full h-10 pl-9 pr-4 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={cycleFilter}
          onChange={(e) => setCycleFilter(e.target.value)}
          className="text-xs bg-amber-50/30 border border-amber-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 font-medium"
        >
          <option value="ALL">All Billing Frequencies</option>
          <option value="MONTHLY">Monthly Subscriptions</option>
          <option value="ANNUAL">Annual Subscriptions</option>
        </select>
      </div>

      {/* Subscription Timeline Cards - Light White & Light Yellow */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => {
          return (
            <div
              key={tenant.id}
              className="bg-white border border-amber-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg p-1.5 rounded-lg bg-amber-50 border border-amber-100">{tenant.logo}</span>
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                      {tenant.name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tenant.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : tenant.status === 'TRIAL'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {tenant.status}
                  </span>
                </div>

                <div className="bg-amber-50/30 p-3 rounded-xl border border-amber-100 space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Packaging Plan:</span>
                    <span className="font-semibold text-amber-900">{tenant.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recurring Price:</span>
                    <span className="font-bold text-slate-900">
                      ₹{tenant.planAmount.toLocaleString()} / {tenant.billingCycle.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Next Billing Date:</span>
                    <span className="font-mono text-slate-700">{tenant.renewalDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Diner Orders Processed:</span>
                    <span className="font-semibold text-amber-800">{tenant.monthlyOrders} orders</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-amber-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => generateInvoice(tenant)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-xs font-semibold text-amber-950 text-center transition-colors"
                >
                  Send Invoice
                </button>
                {tenant.status === 'OVERDUE' ? (
                  <button
                    onClick={() => toggleTenantStatus(tenant.id, 'ACTIVE')}
                    className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 transition-colors"
                  >
                    Mark Paid
                  </button>
                ) : (
                  <button
                    onClick={() => showToast(`Automated payment reminder dispatched to ${tenant.ownerPhone}`, 'info')}
                    className="py-1.5 px-3 rounded-lg bg-amber-100/70 hover:bg-amber-200/70 border border-amber-300 text-xs font-bold text-amber-950 transition-colors"
                  >
                    Remind
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
