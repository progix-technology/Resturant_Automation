import React from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  Globe2,
  ArrowUpRight,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminAnalyticsPage = () => {
  const { metrics, tenants, plans } = useSuperAdminData();

  const cities = [
    { name: 'Bengaluru', count: 2, gmv: '₹4.8L', share: 40 },
    { name: 'New Delhi', count: 1, gmv: '₹9.2L', share: 25 },
    { name: 'Mumbai', count: 1, gmv: '₹3.4L', share: 18 },
    { name: 'Gurugram', count: 1, gmv: '₹11.5L', share: 10 },
    { name: 'Pune & Kolkata', count: 2, gmv: '₹2.2L', share: 7 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          SaaS Growth & Market Analytics
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Deep-dive into multi-tenant revenue trajectory, client churn metrics, and order throughput.
        </p>
      </div>

      {/* Top Analytics Cards - Light White & Light Yellow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-amber-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-bold">ARPU (Avg Revenue Per User)</span>
          <p className="text-2xl font-black text-slate-900">₹2,665 <span className="text-xs font-normal text-slate-400">/ mo</span></p>
          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12% driven by Pro upgrades
          </span>
        </div>

        <div className="bg-white border border-amber-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-bold">Platform Churn Rate</span>
          <p className="text-2xl font-black text-emerald-700">1.8%</p>
          <span className="text-[11px] text-slate-500">Industry benchmark: 3.5%</span>
        </div>

        <div className="bg-white border border-amber-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-bold">Projected Customer LTV</span>
          <p className="text-2xl font-black text-slate-900">₹38,400</p>
          <span className="text-[11px] text-amber-800 font-semibold">14.4 months avg retention</span>
        </div>

        <div className="bg-white border border-amber-100 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs text-slate-500 uppercase font-bold">Active Table QR Deployed</span>
          <p className="text-2xl font-black text-slate-900">{metrics.totalTables} Tables</p>
          <span className="text-[11px] text-slate-500">Across {metrics.totalTenantsCount} restaurant accounts</span>
        </div>
      </div>

      {/* Breakdown Grid - Light White & Light Yellow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Geographic Distribution */}
        <div className="bg-white border border-amber-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-amber-600" />
              Regional Market Penetration
            </h2>
            <span className="text-xs text-slate-500">By Restaurant GMV</span>
          </div>

          <div className="space-y-3 pt-2">
            {cities.map((city, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{city.name} ({city.count} clients)</span>
                  <span className="font-bold text-slate-900">{city.gmv} volume</span>
                </div>
                <div className="w-full h-2 bg-amber-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                    style={{ width: `${city.share * 2}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Adoption Share */}
        <div className="bg-white border border-amber-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-600" />
              Packaging Plan Adoption
            </h2>
            <span className="text-xs text-slate-500">Tier Breakdown</span>
          </div>

          <div className="space-y-3 pt-2">
            {plans.map((p) => {
              const count = tenants.filter((t) => t.planId === p.id).length;
              const percent = Math.round((count / (tenants.length || 1)) * 100);

              return (
                <div key={p.id} className="p-3 bg-amber-50/30 rounded-xl border border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{p.name}</p>
                    <p className="text-[11px] text-slate-500">₹{p.monthlyPrice.toLocaleString()}/mo • {p.maxTables} tables limit</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-900">{count} Tenants</span>
                    <p className="text-[10px] text-slate-500">{percent}% of total</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
