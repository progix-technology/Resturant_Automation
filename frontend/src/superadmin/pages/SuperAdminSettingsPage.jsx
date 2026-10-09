import React, { useState } from 'react';
import {
  Sliders,
  Building2,
  CreditCard,
  Save,
  Key,
  Upload,
  QrCode,
  Landmark,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useSuperAdminData } from '../context/SuperAdminDataContext';
import { API_BASE_URL } from '../../services/apiConfig';

export const SuperAdminSettingsPage = () => {
  const { settings, updatePlatformSettings, showToast } = useSuperAdminData();
  const [isUploadingQr, setIsUploadingQr] = useState(false);

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
    upiId: settings.upiId || 'progixtechnology@upi',
    upiQrUrl: settings.upiQrUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=progixtechnology@upi%26pn=Progix%20SaaS',
    bankName: settings.bankName || 'HDFC Bank',
    accountHolder: settings.accountHolder || 'Progix Technology Pvt Ltd',
    accountNumber: settings.accountNumber || '50200012345678',
    ifscCode: settings.ifscCode || 'HDFC0001234',
  });

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    const bodyData = new FormData();
    bodyData.append('image', file);
    bodyData.append('type', 'superadmin-qr');

    try {
      const res = await fetch(`${API_BASE_URL}/upload/restaurant-image`, {
        method: 'POST',
        body: bodyData,
      });
      const data = await res.json();
      if (data && data.success && data.url) {
        setFormData((prev) => ({ ...prev, upiQrUrl: data.url }));
        showToast('SuperAdmin Payment QR Image uploaded to Cloudinary successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to upload QR image', 'error');
      }
    } catch (err) {
      console.error('QR Upload error:', err);
      showToast('Error uploading QR code image to Cloudinary', 'error');
    } finally {
      setIsUploadingQr(false);
    }
  };

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
          Configure multi-tenant company details, official UPI & QR Payment receiving accounts, and bank transfer credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SuperAdmin Official UPI & QR Code Configuration (Cloudinary Saved) */}
        <div className="bg-white border border-amber-200 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-amber-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-600" />
                SuperAdmin Payment QR Code Image & UPI Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Direct QR image saved to Cloudinary & shown to restaurant admins during plan upgrade
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
              Cloudinary Storage Integrated ✓
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs items-center">
            {/* Live QR Image Preview */}
            <div className="text-center space-y-2 bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
              <span className="text-[11px] font-bold text-slate-700 block">Live Payment QR Preview</span>
              {formData.upiQrUrl ? (
                <img
                  src={formData.upiQrUrl}
                  alt="SuperAdmin Payment QR Code"
                  className="w-40 h-40 mx-auto rounded-2xl border-2 border-amber-400 p-1.5 bg-white shadow-md object-contain"
                />
              ) : (
                <div className="w-40 h-40 mx-auto rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  No QR Code
                </div>
              )}
              <span className="text-[10px] text-slate-500 block truncate max-w-[180px] mx-auto">
                {formData.upiQrUrl}
              </span>
            </div>

            {/* Upload & Fields */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Upload Official Payment QR Image (Cloudinary Storage)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold cursor-pointer transition-all shadow-sm">
                    {isUploadingQr ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{isUploadingQr ? 'Uploading to Cloudinary...' : 'Upload Image File (PNG/JPG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      disabled={isUploadingQr}
                      className="hidden"
                    />
                  </label>
                  {formData.upiQrUrl.includes('cloudinary') && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Saved on Cloudinary
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SuperAdmin UPI VPA ID</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="e.g. progixtechnology@upi"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">QR Code Direct Image URL</label>
                  <input
                    type="text"
                    value={formData.upiQrUrl}
                    onChange={(e) => setFormData({ ...formData, upiQrUrl: e.target.value })}
                    placeholder="Cloudinary image URL"
                    className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SuperAdmin Official Bank Account Details (Shown to Admin on Payment) */}
        <div className="bg-white border border-amber-100 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-amber-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-600" />
              SuperAdmin Bank Account & GST Billing Details
            </h2>
            <p className="text-xs text-slate-500">
              Direct NEFT / IMPS bank credentials displayed alongside UPI QR during plan upgrade
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g. HDFC Bank"
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                placeholder="e.g. Progix Technology Pvt Ltd"
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g. 50200012345678"
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">IFSC Branch Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                placeholder="e.g. HDFC0001234"
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Tax Identifier</label>
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g. 29AAFCO1234F1Z8"
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Support Phone</label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

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
              <label className="block font-semibold text-slate-700 mb-1">Billing Support Email</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full h-9 px-3 bg-amber-50/20 border border-amber-200 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
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

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform & Bank Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
