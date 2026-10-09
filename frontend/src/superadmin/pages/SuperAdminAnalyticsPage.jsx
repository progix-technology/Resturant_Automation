import React, { useMemo } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  Globe2,
  ArrowUpRight,
  Building2,
  ShoppingBag,
  Users,
  Layers,
  Table2,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminAnalyticsPage = () => {
  const { metrics, tenants, plans } = useSuperAdminData();

  // ── Derived Real-time Market Analytics ──────────────────────────────────
  const analytics = useMemo(() => {
    const activeTenants = tenants.filter((t) => t.status === 'ACTIVE');
    const activeCount = activeTenants.length;

    // ARPU (Average Revenue Per User)
    const arpu = activeCount > 0 ? Math.round(metrics.mrr / activeCount) : 0;

    // Churn Rate (Overdue + Suspended / Total)
    const nonActiveCount = tenants.filter((t) => t.status === 'OVERDUE' || t.status === 'SUSPENDED').length;
    const churnRate = tenants.length > 0 ? ((nonActiveCount / tenants.length) * 100).toFixed(1) : '0.0';

    // Estimated LTV (14-month retention baseline)
    const ltv = arpu * 14;

    // Dynamic City Breakdown
    const cityMap = {};
    tenants.forEach((t) => {
      const cityName = t.city || 'Unassigned Region';
      if (!cityMap[cityName]) {
        cityMap[cityName] = { count: 0, gmv: 0 };
      }
      cityMap[cityName].count += 1;
      cityMap[cityName].gmv += t.monthlyGMV || 0;
    });

    const totalGMV = metrics.totalGMV || 1;
    const cities = Object.entries(cityMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        gmv: data.gmv,
        share: Math.max(5, Math.round((data.gmv / totalGMV) * 100)),
      }))
      .sort((a, b) => b.gmv - a.gmv);

    // Top GMV Restaurants
    const topGMVTenants = [...tenants]
      .sort((a, b) => (b.monthlyGMV || 0) - (a.monthlyGMV || 0))
      .slice(0, 5);

    // Plan adoption breakdown
    const planBreakdown = plans.map((p) => {
      const subscribers = tenants.filter((t) => t.planId === p.id || t.planName === p.name);
      const activeSubs = subscribers.filter((t) => t.status === 'ACTIVE');
      const monthlyRev = activeSubs.reduce((acc, t) => acc + (t.planAmount || p.monthlyPrice || 0), 0);
      const sharePct = tenants.length > 0 ? Math.round((subscribers.length / tenants.length) * 100) : 0;
      return {
        ...p,
        totalSubscribers: subscribers.length,
        activeSubscribers: activeSubs.length,
        monthlyRev,
        sharePct,
      };
    });

    return { arpu, churnRate, ltv, cities, topGMVTenants, planBreakdown };
  }, [metrics, tenants, plans]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wide mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>Platform Intelligence</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            SaaS Growth & Market Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Real-time insights into multi-tenant revenue trajectory, regional market footprint, plan adoption rates, and top restaurant GMV performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-right">
            <p className="text-[10px] text-amber-800 font-bold uppercase">Total Platform GMV</p>
            <p className="text-lg font-black text-slate-900">₹{((metrics.totalGMV || 0) / 100000).toFixed(1)} Lakhs</p>
          </div>
        </div>
      </div>

      {/* ── Top 4 Analytics KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">ARPU (Avg Revenue Per User)</span>
          <p className="text-2xl font-black text-slate-900">
            ₹{analytics.arpu.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ mo</span>
          </p>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Calculated across active tenants
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Platform Churn Rate</span>
          <p className="text-2xl font-black text-emerald-700">{analytics.churnRate}%</p>
          <span className="text-[11px] text-slate-500">Industry benchmark &lt; 3.5%</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Projected Client LTV</span>
          <p className="text-2xl font-black text-slate-900">₹{analytics.ltv.toLocaleString()}</p>
          <span className="text-[11px] text-amber-800 font-semibold">14-month avg retention model</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Table QR Codes</span>
          <p className="text-2xl font-black text-slate-900">{metrics.totalTables} Tables</p>
          <span className="text-[11px] text-slate-500">Across {metrics.totalTenantsCount} client accounts</span>
        </div>
      </div>

      {/* ── Dynamic Analytics Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real City Regional Footprint */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-amber-600" />
              Regional Market Distribution
            </h2>
            <span className="text-xs text-slate-500 font-semibold">Live City GMV Share</span>
          </div>

          <div className="space-y-4 pt-2">
            {analytics.cities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No city location data available yet.</p>
            ) : (
              analytics.cities.map((city, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-extrabold text-slate-900">
                      {city.name} ({city.count} {city.count === 1 ? 'restaurant' : 'restaurants'})
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(city.gmv / 1000).toFixed(1)}K GMV ({city.share}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                      style={{ width: `${Math.min(100, city.share * 1.5)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Plan Adoption Breakdown */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-600" />
              Packaging Tier Adoption
            </h2>
            <span className="text-xs text-slate-500 font-semibold">Tier Distribution</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.planBreakdown.map((p) => (
              <div key={p.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{p.name}</p>
                  <p className="text-[11px] text-slate-500">
                    ₹{p.monthlyPrice?.toLocaleString()}/mo • {p.maxTables} tables limit
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                    {p.totalSubscribers} Clients
                  </span>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                    {p.sharePct}% share · ₹{p.monthlyRev.toLocaleString()}/mo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Client Performance Roster ───────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              Top GMV Generating Restaurant Accounts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Ranked by monthly gross merchandise throughput</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.topGMVTenants.map((t, idx) => (
            <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl p-1.5 bg-white rounded-xl border border-slate-200">{t.logo || '🏪'}</span>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 truncate max-w-[120px]">{t.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono">{t.city}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-600">#{idx + 1}</span>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center text-xs">
                <span className="text-slate-500">Monthly GMV:</span>
                <span className="font-black text-slate-900">₹{((t.monthlyGMV || 0) / 1000).toFixed(1)}K</span>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Orders: {t.monthlyOrders?.toLocaleString() || 0}</span>
                <span className="font-bold text-amber-900">{t.planName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
