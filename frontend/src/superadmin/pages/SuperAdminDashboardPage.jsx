import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Building2,
  PackageCheck,
  ShoppingBag,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ExternalLink,
  DollarSign,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Activity,
  IndianRupee,
  Users,
  BarChart3,
  CreditCard,
  Zap,
  RefreshCw,
  ChevronRight,
  Table2,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

// ─── Tiny Sparkline (CSS-only bar chart) ───────────────────────────────────
const MiniBar = ({ value, max, color = 'bg-amber-500' }) => {
  const pct = Math.max(4, Math.round((value / (max || 1)) * 100));
  return (
    <div className="flex-1 bg-slate-100 rounded-full overflow-hidden h-1.5">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ─── Metric Card ───────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, sub, trend, trendUp, iconBg = 'bg-slate-100', iconColor = 'text-slate-700' }) => (
  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 hover:shadow-xs hover:border-slate-300 transition-all">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
    {trend && (
      <div className={`flex items-center gap-1 text-[11px] font-semibold ${trendUp ? 'text-emerald-700' : 'text-rose-600'}`}>
        {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        <span>{trend}</span>
      </div>
    )}
    {sub && !trend && <p className="text-[11px] text-slate-500">{sub}</p>}
  </div>
);

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE:    { cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
    TRIAL:     { cls: 'bg-amber-50 text-amber-900 border-amber-200',      icon: Clock },
    OVERDUE:   { cls: 'bg-rose-50 text-rose-700 border-rose-200',          icon: AlertCircle },
    SUSPENDED: { cls: 'bg-slate-100 text-slate-600 border-slate-300',      icon: Ban },
  };
  const cfg = map[status] || map.ACTIVE;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {status}
    </span>
  );
};

// ─── Main Dashboard Page ───────────────────────────────────────────────────
export const SuperAdminDashboardPage = () => {
  const { metrics, tenants, plans, invoices, isLoading, markInvoicePaid } = useSuperAdminData();
  const navigate = useNavigate();

  const pendingRecharges = useMemo(() => {
    return invoices.filter(i => i.status === 'PENDING');
  }, [invoices]);

  // ── Derived analytics from live data ────────────────────────────────────
  const analytics = useMemo(() => {
    const active    = tenants.filter(t => t.status === 'ACTIVE');
    const trial     = tenants.filter(t => t.status === 'TRIAL');
    const overdue   = tenants.filter(t => t.status === 'OVERDUE');
    const suspended = tenants.filter(t => t.status === 'SUSPENDED');

    // Revenue breakdown per plan
    const planRevenue = plans.map(plan => {
      const subscribers = tenants.filter(t => t.planId === plan.id && t.status === 'ACTIVE');
      const rev = subscribers.reduce((acc, t) => {
        if (t.billingCycle === 'ANNUAL') return acc + Math.round((t.planAmount || 0) / 12);
        return acc + (t.planAmount || 0);
      }, 0);
      return { ...plan, subscribers: subscribers.length, monthlyRevenue: rev };
    });

    const maxPlanRev = Math.max(...planRevenue.map(p => p.monthlyRevenue), 1);

    // Top 5 tenants by GMV
    const topByGMV = [...tenants]
      .sort((a, b) => (b.monthlyGMV || 0) - (a.monthlyGMV || 0))
      .slice(0, 5);

    // Recent invoices
    const pendingInvoices = invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE');
    const recentInvoices  = [...invoices].slice(0, 6);

    // Renewal alerts (due within 7 days)
    const today = new Date();
    const upcomingRenewals = tenants
      .filter(t => {
        if (!t.renewalDate) return false;
        const diff = (new Date(t.renewalDate) - today) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      })
      .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

    // City distribution
    const cityMap = {};
    tenants.forEach(t => {
      cityMap[t.city] = (cityMap[t.city] || 0) + 1;
    });
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      active, trial, overdue, suspended,
      planRevenue, maxPlanRev,
      topByGMV, pendingInvoices, recentInvoices,
      upcomingRenewals, topCities,
    };
  }, [tenants, plans, invoices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
        <span className="ml-3 text-slate-600 font-semibold">Loading platform data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Pending Payment Recharge Alert Banner ────────────────────────────── */}
      {pendingRecharges.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-5 shadow-lg border border-amber-400 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              <Zap className="w-5 h-5 text-yellow-300 animate-bounce" />
              <span>New Recharge Payment Received ({pendingRecharges.length})</span>
            </div>
            <button
              onClick={() => navigate('/superadmin/invoices')}
              className="text-xs font-bold underline hover:text-amber-100 cursor-pointer"
            >
              View Invoices →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingRecharges.map((inv) => (
              <div key={inv.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-black text-white text-sm">{inv.restaurantName}</p>
                  <p className="text-amber-100 font-medium">
                    Paid for <strong className="text-white font-bold">{inv.requestedPlanName || inv.planName}</strong> · ₹{inv.total?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-amber-200 font-mono mt-0.5">
                    UTR: {inv.utrNumber || 'N/A'} · Ref #{inv.id}
                  </p>
                </div>
                <button
                  onClick={() => markInvoicePaid(inv.id)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl font-black text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Approve & Activate</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-md overflow-hidden">
        {/* decorative background blurs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-8 right-24 w-24 h-24 bg-amber-400/5 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Multi-Tenant SaaS Command Centre</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Platform Executive Overview
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {tenants.length} {tenants.length === 1 ? 'restaurant' : 'restaurants'} onboarded · ₹{metrics.mrr.toLocaleString()} MRR · {metrics.totalOrders.toLocaleString()} orders processed
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            {analytics.upcomingRenewals.length > 0 && (
              <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>{analytics.upcomingRenewals.length} renewal{analytics.upcomingRenewals.length > 1 ? 's' : ''} due soon</span>
              </div>
            )}
            {analytics.overdue.length > 0 && (
              <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{analytics.overdue.length} overdue payment{analytics.overdue.length > 1 ? 's' : ''}</span>
              </div>
            )}
            <button
              onClick={() => navigate('/superadmin/restaurants?new=true')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard Restaurant</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Primary KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={TrendingUp}
          label="Monthly Recurring Revenue"
          value={`₹${metrics.mrr.toLocaleString()}`}
          trend="+24.6% vs last cycle"
          trendUp={true}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
        />
        <MetricCard
          icon={DollarSign}
          label="Annual Run Rate (ARR)"
          value={`₹${(metrics.arr / 100000).toFixed(2)} L`}
          sub="Projected 12-month platform licensing"
          iconBg="bg-blue-50"
          iconColor="text-blue-700"
        />
        <MetricCard
          icon={Building2}
          label="Client Restaurants"
          value={`${metrics.activeTenantsCount}`}
          sub={`${metrics.trialTenantsCount} Trial · ${metrics.overdueTenantsCount} Overdue · ${metrics.totalTenantsCount} Total`}
          iconBg="bg-slate-100"
          iconColor="text-slate-700"
        />
        <MetricCard
          icon={ShoppingBag}
          label="Total Client GMV"
          value={`₹${(metrics.totalGMV / 100000).toFixed(1)} L`}
          sub={`${metrics.totalOrders.toLocaleString()} diner orders processed`}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* ── Middle Row: Status Breakdown + Plan Revenue + Renewals ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Status Breakdown Donut-style */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-amber-600" />
            Tenant Status Breakdown
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Active',    count: analytics.active.length,    total: tenants.length, color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
              { label: 'Trial',     count: analytics.trial.length,     total: tenants.length, color: 'bg-amber-500',   textColor: 'text-amber-700',   bg: 'bg-amber-50' },
              { label: 'Overdue',   count: analytics.overdue.length,   total: tenants.length, color: 'bg-rose-500',    textColor: 'text-rose-700',    bg: 'bg-rose-50' },
              { label: 'Suspended', count: analytics.suspended.length, total: tenants.length, color: 'bg-slate-400',   textColor: 'text-slate-600',   bg: 'bg-slate-50' },
            ].map(row => (
              <div key={row.label} className={`flex items-center gap-3 p-3 rounded-xl ${row.bg}`}>
                <span className={`text-sm font-black ${row.textColor} w-4`}>{row.count}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{row.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {tenants.length > 0 ? Math.round((row.count / tenants.length) * 100) : 0}%
                    </span>
                  </div>
                  <MiniBar value={row.count} max={tenants.length} color={row.color} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 text-center">
              <span className="font-bold text-slate-700">{metrics.pendingCollection > 0 ? `₹${metrics.pendingCollection.toLocaleString()}` : '₹0'}</span> pending collection
            </p>
          </div>
        </div>

        {/* Plan Revenue Bars */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              Plan Revenue Distribution
            </h2>
            <button
              onClick={() => navigate('/superadmin/plans')}
              className="text-[11px] text-amber-700 font-bold hover:text-amber-900 flex items-center gap-0.5"
            >
              All Plans <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            {analytics.planRevenue.map((plan, idx) => {
              const colors = ['bg-amber-500', 'bg-orange-500', 'bg-yellow-500'];
              return (
                <div key={plan.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{plan.name}</span>
                      <span className="ml-2 text-[10px] text-slate-500">{plan.subscribers} active</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900">
                      ₹{plan.monthlyRevenue.toLocaleString()}/mo
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MiniBar value={plan.monthlyRevenue} max={analytics.maxPlanRev} color={colors[idx % colors.length]} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-lg font-black text-slate-900">₹{metrics.mrr.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Total MRR</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-slate-900">{tenants.filter(t => t.status === 'ACTIVE').length}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Paying Clients</p>
            </div>
          </div>
        </div>

        {/* Renewal Alerts + Pending Payments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-600" />
              Upcoming Renewals
            </h2>
            {analytics.upcomingRenewals.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500">No renewals due in next 7 days</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.upcomingRenewals.map(t => {
                  const daysLeft = Math.ceil((new Date(t.renewalDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{t.logo}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{t.name}</p>
                          <p className="text-[10px] text-slate-500">{t.planName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-amber-800">{daysLeft}d</p>
                        <p className="text-[10px] text-slate-500">₹{t.planAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {analytics.pendingInvoices.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold text-rose-700 flex items-center gap-1.5 mb-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Overdue / Pending Invoices ({analytics.pendingInvoices.length})
              </h3>
              <div className="space-y-1.5">
                {analytics.pendingInvoices.slice(0, 3).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold truncate max-w-[140px]">{inv.restaurantName}</span>
                    <span className="font-bold text-rose-700">₹{inv.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/superadmin/invoices')}
                className="mt-2 w-full text-center text-[11px] text-amber-700 font-bold hover:text-amber-900 py-1"
              >
                View All Invoices →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Restaurants by GMV ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              Top Performing Restaurants by GMV
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Sorted by monthly gross merchandise value</p>
          </div>
          <button
            onClick={() => navigate('/superadmin/restaurants')}
            className="text-xs text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1"
          >
            View All ({tenants.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {analytics.topByGMV.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-semibold">
            No performance data available. Onboard restaurants to view live GMV stats.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {analytics.topByGMV.map((tenant, idx) => {
              const maxGMV = analytics.topByGMV[0]?.monthlyGMV || 1;
              return (
                <div key={tenant.id} className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50/40 transition-colors">
                  <span className={`text-xs font-black w-5 shrink-0 ${idx === 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-xl shrink-0">{tenant.logo}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{tenant.name}</p>
                      <StatusBadge status={tenant.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniBar
                        value={tenant.monthlyGMV || 0}
                        max={maxGMV}
                        color={idx === 0 ? 'bg-amber-500' : 'bg-slate-300'}
                      />
                      <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono shrink-0">
                        {tenant.monthlyOrders?.toLocaleString() || 0} orders
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-slate-900">
                      ₹{((tenant.monthlyGMV || 0) / 100000).toFixed(1)}L
                    </p>
                    <p className="text-[10px] text-slate-500">{tenant.city}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Full Client Roster Table ──────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              Restaurant Client Roster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Live status, assigned plan & renewal countdown</p>
          </div>
          <button
            onClick={() => navigate('/superadmin/restaurants')}
            className="text-xs text-amber-800 hover:text-amber-900 font-bold"
          >
            Manage All →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Restaurant</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Tables</th>
                <th className="px-4 py-3">Monthly GMV</th>
                <th className="px-4 py-3">Renewal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500 font-medium">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No Restaurants Onboarded Yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Add your first client restaurant to start managing platform licenses and subscriptions.
                    </p>
                    <button
                      onClick={() => navigate('/superadmin/restaurants?new=true')}
                      className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Onboard First Restaurant
                    </button>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => {
                  const today = new Date();
                  const renewal = tenant.renewalDate ? new Date(tenant.renewalDate) : null;
                  const daysLeft = renewal ? Math.ceil((renewal - today) / (1000 * 60 * 60 * 24)) : null;
                  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

                  return (
                    <tr key={tenant.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg p-1.5 rounded-lg bg-amber-50 border border-amber-100">{tenant.logo}</span>
                          <div>
                            <p className="font-bold text-slate-900">{tenant.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{tenant.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{tenant.ownerName}</p>
                        <p className="text-[10px] text-slate-500">{tenant.ownerEmail}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-amber-50 border border-amber-200 font-bold text-amber-900">
                          {tenant.planName}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          ₹{tenant.planAmount?.toLocaleString()} / {tenant.billingCycle?.toLowerCase()}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Table2 className="w-3.5 h-3.5 text-slate-400" />
                          {tenant.activeTables || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">₹{((tenant.monthlyGMV || 0) / 1000).toFixed(1)}K</p>
                        <p className="text-[10px] text-slate-500">{(tenant.monthlyOrders || 0).toLocaleString()} orders</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {tenant.renewalDate ? (
                          <p className={`font-mono text-[11px] font-semibold ${isUrgent ? 'text-rose-600' : 'text-slate-600'}`}>
                            {tenant.renewalDate}
                            {isUrgent && daysLeft !== null && (
                              <span className="ml-1 text-[10px] font-bold text-rose-600">({daysLeft}d left)</span>
                            )}
                          </p>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={tenant.status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <a
                          href={`/menu/${tenant.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-amber-700 rounded-lg hover:bg-amber-100/60 inline-flex transition-colors"
                          title="View Customer Menu"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Row: City Footprint + Recent Invoices ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* City Footprint */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-amber-600" />
            Geographic Footprint
          </h2>
          {analytics.topCities.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 font-medium">No city distribution data yet</p>
          ) : (
            <div className="space-y-3">
              {analytics.topCities.map(([city, count]) => (
                <div key={city} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700 w-28 truncate">{city}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <MiniBar value={count} max={analytics.topCities[0][1]} color="bg-amber-500" />
                    <span className="text-[11px] font-bold text-slate-500 shrink-0">
                      {count} {count === 1 ? 'restaurant' : 'restaurants'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              Recent Invoices
            </h2>
            <button
              onClick={() => navigate('/superadmin/invoices')}
              className="text-[11px] text-amber-700 font-bold hover:text-amber-900 flex items-center gap-0.5"
            >
              All Invoices <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {analytics.recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              <CreditCard className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
              No invoices generated yet
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.recentInvoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{inv.restaurantName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{inv.id} · {inv.issuedDate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-slate-900">₹{inv.total.toLocaleString()}</p>
                    <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : inv.status === 'OVERDUE'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
