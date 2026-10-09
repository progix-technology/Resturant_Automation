import React, { useState, useMemo } from 'react';
import {
  Zap,
  Calendar,
  Building2,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CreditCard,
  TrendingUp,
  SlidersHorizontal,
  X,
  Plus,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminSubscriptionsPage = () => {
  const { tenants, plans, updateTenant, toggleTenantStatus, generateInvoice, showToast } = useSuperAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingDateTenant, setEditingDateTenant] = useState(null);
  const [newRenewalDate, setNewRenewalDate] = useState('');

  // ── Real-time Analytics Summary ─────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter((t) => t.status === 'ACTIVE').length;
    const trial = tenants.filter((t) => t.status === 'TRIAL').length;
    const overdue = tenants.filter((t) => t.status === 'OVERDUE').length;
    const monthly = tenants.filter((t) => (t.billingCycle || 'MONTHLY') === 'MONTHLY').length;
    const annual = tenants.filter((t) => t.billingCycle === 'ANNUAL').length;

    const totalMrr = tenants
      .filter((t) => t.status === 'ACTIVE')
      .reduce((acc, t) => acc + (t.planAmount || 0), 0);

    return { total, active, trial, overdue, monthly, annual, totalMrr };
  }, [tenants]);

  // ── Filtered Tenants List ───────────────────────────────────────────────
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.planName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCycle = cycleFilter === 'ALL' || (t.billingCycle || 'MONTHLY') === cycleFilter;
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchSearch && matchCycle && matchStatus;
    });
  }, [tenants, searchTerm, cycleFilter, statusFilter]);

  const handleOpenDateModal = (tenant) => {
    setEditingDateTenant(tenant);
    setNewRenewalDate(tenant.renewalDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  };

  const handleSaveDate = async (e) => {
    e.preventDefault();
    if (!editingDateTenant || !newRenewalDate) return;

    try {
      await updateTenant(editingDateTenant.id, {
        renewalDate: newRenewalDate,
      });
      showToast(`Subscription validity date updated to ${newRenewalDate} for ${editingDateTenant.name}`, 'success');
      setEditingDateTenant(null);
    } catch (err) {
      showToast('Failed to update validity date', 'error');
    }
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
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wide mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Multi-Tenant Licensing</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscription Lifecycles & Validity Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Monitor SaaS expiration dates, extend validity periods, issue renewal invoices, and manage client active statuses in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-right">
            <p className="text-[10px] text-amber-800 font-bold uppercase">Active MRR Pool</p>
            <p className="text-lg font-black text-slate-900">₹{stats.totalMrr.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── 4 Live KPI Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Subscriptions</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{stats.active} Active · {stats.trial} Trial</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{stats.active}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Licensed & Operational</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue / Action Needed</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{stats.overdue}</p>
          <p className="text-[11px] text-rose-700 font-medium mt-0.5">Requires Payment Settlement</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Billing Frequency</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.monthly} <span className="text-xs font-normal text-slate-500">Monthly</span></p>
          <p className="text-[11px] text-slate-500 mt-0.5">{stats.annual} Annual Subscriptions</p>
        </div>
      </div>

      {/* ── Filters & Controls Bar ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by restaurant name, owner, city, or plan..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 font-bold"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL">TRIAL</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>

          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-amber-500 font-bold"
          >
            <option value="ALL">All Cycles</option>
            <option value="MONTHLY">Monthly</option>
            <option value="ANNUAL">Annual</option>
          </select>
        </div>
      </div>

      {/* ── Subscription Cards Grid ─────────────────────────────────────── */}
      {filteredTenants.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-2xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Subscriptions Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No restaurant subscriptions match your filter query "{searchTerm}".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTenants.map((tenant) => {
            const today = new Date();
            const renewal = tenant.renewalDate ? new Date(tenant.renewalDate) : null;
            const daysLeft = renewal ? Math.ceil((renewal - today) / (1000 * 60 * 60 * 24)) : null;
            const isWarning = daysLeft !== null && daysLeft <= 7;

            return (
              <div
                key={tenant.id}
                className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs flex flex-col justify-between hover:border-amber-300 hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Top Accent Strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    tenant.status === 'ACTIVE'
                      ? 'bg-emerald-500'
                      : tenant.status === 'TRIAL'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />

                <div>
                  <div className="flex items-center justify-between mb-4 pt-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-2xl bg-amber-50 border border-amber-100 shadow-inner">
                        {tenant.logo || '🏪'}
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-[150px]">
                          {tenant.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-medium">{tenant.city || 'India'}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : tenant.status === 'TRIAL'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </div>

                  {/* Plan Information Card */}
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70 space-y-2.5 text-xs mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Subscription Tier:</span>
                      <span className="font-extrabold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                        {tenant.planName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Monthly Fee:</span>
                      <span className="font-black text-slate-900">
                        ₹{tenant.planAmount?.toLocaleString()} / {(tenant.billingCycle || 'Monthly').toLowerCase()}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Expiry Date</span>
                        <span className="font-mono text-xs font-extrabold text-slate-900">
                          {tenant.renewalDate || 'Not Configured'}
                        </span>
                        {daysLeft !== null && (
                          <span
                            className={`text-[10px] font-bold block mt-0.5 ${
                              isWarning ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expired'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDateModal(tenant)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>Edit Date</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => generateInvoice(tenant)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 text-center transition-colors cursor-pointer"
                  >
                    Send Invoice
                  </button>

                  {tenant.status === 'OVERDUE' ? (
                    <button
                      type="button"
                      onClick={() => toggleTenantStatus(tenant.id, 'ACTIVE')}
                      className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Approve & Activate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => showToast(`Payment reminder dispatched to ${tenant.ownerPhone || tenant.ownerEmail}`, 'info')}
                      className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      Remind Client
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Edit Expiry / Renewal Date ───────────────────────────── */}
      {editingDateTenant && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-left text-slate-800 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Extend Validity ({editingDateTenant.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDateTenant(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plan Expiry / Renewal Date
                </label>
                <input
                  type="date"
                  required
                  value={newRenewalDate}
                  onChange={(e) => setNewRenewalDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Quick Validity Extension Shortcuts:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(30)}
                    className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(90)}
                    className="py-2 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + 90 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickExtend(365)}
                    className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + 1 Year
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDateTenant(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
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
