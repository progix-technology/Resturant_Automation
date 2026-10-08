import React, { useState } from 'react';
import {
  Zap,
  Calendar,
  Building2,
  Search,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminSubscriptionsPage = () => {
  const { tenants, plans, updateTenant, toggleTenantStatus, generateInvoice, showToast } = useSuperAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [editingDateTenant, setEditingDateTenant] = useState(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');

  const filteredTenants = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCycle = cycleFilter === 'ALL' || t.billingCycle === cycleFilter;
    return matchSearch && matchCycle;
  });

  const handleOpenDateModal = (tenant) => {
    setEditingDateTenant(tenant);
    setNewRenewalDate(tenant.renewalDate || new Date().toISOString().split('T')[0]);
  };

  const handleSaveDate = async (e) => {
    e.preventDefault();
    if (!editingDateTenant || !newRenewalDate) return;

    await updateTenant(editingDateTenant.id, {
      renewalDate: newRenewalDate,
    });
    showToast(`Subscription validity date updated to ${newRenewalDate} for ${editingDateTenant.name}`, 'success');
    setEditingDateTenant(null);
  };

  const handleQuickExtend = async (days) => {
    if (!editingDateTenant) return;
    const baseDate = editingDateTenant.renewalDate ? new Date(editingDateTenant.renewalDate) : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    const updatedStr = baseDate.toISOString().split('T')[0];
    setNewRenewalDate(updatedStr);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600" />
          Subscription Lifecycles & Validity Management
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Monitor plan expiration dates, extend validity periods, and manage billing cycles for all restaurant tenants.
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

      {/* Subscription Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => {
          const daysLeft = tenant.renewalDate
            ? Math.ceil((new Date(tenant.renewalDate) - new Date()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <div
              key={tenant.id}
              className="bg-white border border-amber-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-amber-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg p-1.5 rounded-lg bg-amber-50 border border-amber-100">{tenant.logo || '🏪'}</span>
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

                <div className="bg-amber-50/30 p-3 rounded-xl border border-amber-100 space-y-2 text-xs mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-semibold text-amber-900">{tenant.planName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Price:</span>
                    <span className="font-bold text-slate-900">
                      ₹{tenant.planAmount?.toLocaleString()} / {(tenant.billingCycle || 'Monthly').toLowerCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-amber-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Expiry / Renewal Date</span>
                      <span className="font-mono text-xs font-bold text-slate-900">{tenant.renewalDate || 'N/A'}</span>
                      {daysLeft !== null && (
                        <span className={`text-[10px] font-bold block ${daysLeft <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenDateModal(tenant)}
                      className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition-colors border border-amber-300"
                    >
                      Edit Date
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Orders Processed:</span>
                    <span className="font-semibold text-amber-800">{tenant.monthlyOrders || 0} orders</span>
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
                    onClick={() => showToast(`Automated payment reminder dispatched to ${tenant.ownerPhone || tenant.ownerEmail}`, 'info')}
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

      {/* Modal: Edit Expiry / Renewal Date */}
      {editingDateTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-amber-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative text-left text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                Edit Subscription Validity ({editingDateTenant.name})
              </h3>
              <button
                type="button"
                onClick={() => setEditingDateTenant(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan Expiry / Renewal Date
                </label>
                <input
                  type="date"
                  required
                  value={newRenewalDate}
                  onChange={(e) => setNewRenewalDate(e.target.value)}
                  className="w-full h-10 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Quick extension shortcuts */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Quick Validity Extension Shortcuts:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(30)}
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all"
                  >
                    + 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(90)}
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all"
                  >
                    + 90 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(365)}
                    className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all"
                  >
                    + 1 Year
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-amber-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDateTenant(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 transition-colors shadow-xs"
                >
                  Save Validity Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
