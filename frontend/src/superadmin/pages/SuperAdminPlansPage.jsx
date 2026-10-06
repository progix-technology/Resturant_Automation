import React, { useState } from 'react';
import {
  PackageCheck,
  Plus,
  Check,
  Edit2,
  X,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminPlansPage = () => {
  const { plans, tenants, updatePlan, addPlan, showToast } = useSuperAdminData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    badge: 'Popular',
    tagline: '',
    monthlyPrice: 1999,
    annualPrice: 19990,
    maxTables: 25,
    maxOrdersPerMonth: 'Unlimited',
    staffAccounts: 5,
    featuresText: '',
  });

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      badge: plan.badge || 'Standard',
      tagline: plan.tagline || '',
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      maxTables: plan.maxTables,
      maxOrdersPerMonth: plan.maxOrdersPerMonth,
      staffAccounts: plan.staffAccounts,
      featuresText: (plan.features || []).join('\n'),
    });
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      badge: 'New Package',
      tagline: '',
      monthlyPrice: 1499,
      annualPrice: 14990,
      maxTables: 20,
      maxOrdersPerMonth: 'Unlimited',
      staffAccounts: 3,
      featuresText: 'Digital Table QR Codes\nLive Order Tracking\nWhatsApp Notifications\nBasic Revenue Reports',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const features = formData.featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPlan) {
      await updatePlan(editingPlan.id, {
        name: formData.name,
        badge: formData.badge,
        tagline: formData.tagline,
        monthlyPrice: Number(formData.monthlyPrice),
        annualPrice: Number(formData.annualPrice),
        maxTables: formData.maxTables,
        maxOrdersPerMonth: formData.maxOrdersPerMonth,
        staffAccounts: formData.staffAccounts,
        features,
      });
    } else {
      await addPlan({
        name: formData.name,
        badge: formData.badge,
        tagline: formData.tagline,
        monthlyPrice: Number(formData.monthlyPrice),
        annualPrice: Number(formData.annualPrice),
        maxTables: formData.maxTables,
        maxOrdersPerMonth: formData.maxOrdersPerMonth,
        staffAccounts: formData.staffAccounts,
        features,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-amber-600" />
            SaaS Packaging & Pricing Tiers
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Define recurring monthly and annual packages to monetize the restaurant QR platform.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Packaging Tier</span>
        </button>
      </div>

      {/* Plan Cards Grid - Light White & Light Yellow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const subscriberCount = tenants.filter((t) => t.planId === plan.id).length;
          const isPro = plan.popular || plan.id === 'plan-growth';

          return (
            <div
              key={plan.id}
              className={`bg-white border rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                isPro
                  ? 'border-amber-400 shadow-md ring-2 ring-amber-300/40 bg-gradient-to-b from-amber-50/30 to-white'
                  : 'border-amber-100 shadow-sm'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    {plan.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {plan.badge || 'Package'}
                  </span>
                </div>

                {/* Price Display */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">
                      ₹{plan.monthlyPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500">/ month</span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-semibold">
                    or ₹{plan.annualPrice?.toLocaleString()} / year (Billed annually)
                  </p>
                </div>

                <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                  {plan.tagline}
                </p>

                {/* Core Limits Capsule */}
                <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-200/70 grid grid-cols-2 gap-2 text-xs mb-5">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Table Limit</span>
                    <span className="font-bold text-slate-950">{plan.maxTables} Tables</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Monthly Orders</span>
                    <span className="font-bold text-slate-950">{plan.maxOrdersPerMonth}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Staff Accounts</span>
                    <span className="font-bold text-slate-950">{plan.staffAccounts} Logins</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Active Tenants</span>
                    <span className="font-bold text-amber-800">{subscriberCount} Subscribed</span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2.5 text-xs text-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Included Capabilities:
                  </p>
                  {(plan.features || []).map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-300">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-slate-700 leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-6 mt-6 border-t border-amber-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  ID: <span className="font-mono text-slate-600">{plan.id}</span>
                </span>
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-950 border border-amber-200 transition-colors shadow-2xs"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Plan</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-amber-200 rounded-2xl w-full max-w-lg p-6 shadow-xl relative text-left text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-amber-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-amber-600" />
                {editingPlan ? `Edit ${editingPlan.name}` : 'Create Packaging Tier'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Platinum Plus"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Header Badge</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Recommended"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Target audience summary"
                  className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.annualPrice}
                    onChange={(e) => setFormData({ ...formData, annualPrice: e.target.value })}
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Table Capacity</label>
                  <input
                    type="text"
                    value={formData.maxTables}
                    onChange={(e) => setFormData({ ...formData, maxTables: e.target.value })}
                    placeholder="e.g. 50 or Unlimited"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Logins</label>
                  <input
                    type="text"
                    value={formData.staffAccounts}
                    onChange={(e) => setFormData({ ...formData, staffAccounts: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Features (1 per line)
                </label>
                <textarea
                  rows={4}
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  placeholder="Unlimited Table QR Codes&#10;WhatsApp Alerts&#10;Sales Analytics"
                  className="w-full p-2.5 bg-amber-50/20 border border-amber-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-amber-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-amber-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold rounded-lg text-xs shadow-md shadow-amber-500/20"
                >
                  Save Packaging Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
