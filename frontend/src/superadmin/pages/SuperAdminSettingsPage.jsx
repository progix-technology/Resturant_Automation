import React, { useState } from 'react';
import {
  Sliders,
  Building2,
  CreditCard,
  Save,
  Key,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';

export const SuperAdminSettingsPage = () => {
  const { settings, updatePlatformSettings, showToast } = useSuperAdminData();

  const [formData, setFormData] = useState({
    platformName: settings.platformName || 'OrderFlow SaaS Engine',
    companyLegalName: settings.companyLegalName || 'Progix Technology Pvt Ltd',
    taxId: settings.taxId || '29AAFCO1234F1Z8',
    supportEmail: settings.supportEmail || 'progixtechnology@gmail.com',
    supportPhone: settings.supportPhone || '+91 80 4455 6677',
    headquarters: settings.headquarters || 'Prestige Tech Cloud, Outer Ring Road, Bengaluru',
    defaultTrialDays: settings.defaultTrialDays || 14,
    gracePeriodDays: settings.gracePeriodDays || 7,
    gstRate: settings.gstRate || 18,
    paymentGateway: settings.paymentGateway || 'Razorpay Subscriptions (Live Mode)',
    autoSuspendUnpaidTenants: settings.autoSuspendUnpaidTenants !== false,
    smsRemindersEnabled: settings.smsRemindersEnabled !== false,
    razorpayKeyId: 'rzp_live_99201948381928',
    razorpaySecret: '••••••••••••••••••••••••',
  });

  const handleSave = (e) => {
    e.preventDefault();
    updatePlatformSettings(formData);
  };

  return (
    <div className="space-y-6 text-slate-800">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-600" />
          Platform Owner & Billing Configuration
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Configure multi-tenant company details, default trial periods, tax compliance, and automated billing rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Legal Information */}
        <div className="bg-white border border-amber-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-amber-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              SaaS Provider Legal Profile
            </h2>
            <p className="text-xs text-slate-500">Used for client invoices and official GST receipts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Entity</label>
              <input
                type="text"
                value={formData.companyLegalName}
                onChange={(e) => setFormData({ ...formData, companyLegalName: e.target.value })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Tax Identifier</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Support Email</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Registered Headquarters Address</label>
              <input
                type="text"
                value={formData.headquarters}
                onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Billing & Packaging Policies */}
        <div className="bg-white border border-amber-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-amber-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              Subscription & Grace Period Automations
            </h2>
            <p className="text-xs text-slate-500">Rules governing restaurant tenant billing cycles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Free Trial Duration (Days)</label>
              <input
                type="number"
                value={formData.defaultTrialDays}
                onChange={(e) => setFormData({ ...formData, defaultTrialDays: Number(e.target.value) })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Overdue Grace Period (Days)</label>
              <input
                type="number"
                value={formData.gracePeriodDays}
                onChange={(e) => setFormData({ ...formData, gracePeriodDays: Number(e.target.value) })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/30 border border-amber-100">
              <div>
                <p className="font-semibold text-slate-900">Auto-Suspend Unpaid Restaurant Portals</p>
                <p className="text-slate-500 text-[11px]">Automatically block dining ordering once grace period expires</p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoSuspendUnpaidTenants}
                onChange={(e) => setFormData({ ...formData, autoSuspendUnpaidTenants: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/30 border border-amber-100">
              <div>
                <p className="font-semibold text-slate-900">Automated WhatsApp & Email Invoice Dispatches</p>
                <p className="text-slate-500 text-[11px]">Send invoice PDF links 5 days prior to plan renewal</p>
              </div>
              <input
                type="checkbox"
                checked={formData.smsRemindersEnabled}
                onChange={(e) => setFormData({ ...formData, smsRemindersEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateway Keys */}
        <div className="bg-white border border-amber-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-amber-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              SaaS Payment Gateway Configuration
            </h2>
            <p className="text-xs text-slate-500">Recurring billing processor credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={formData.razorpayKeyId}
                onChange={(e) => setFormData({ ...formData, razorpayKeyId: e.target.value })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Razorpay Secret</label>
              <input
                type="password"
                value={formData.razorpaySecret}
                onChange={(e) => setFormData({ ...formData, razorpaySecret: e.target.value })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
