import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, Zap, X, Check, Lock, Crown, Copy, CheckCircle2, Clock, ArrowLeft, QrCode, Landmark } from 'lucide-react';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { superAdminBillingService } from '../../superadmin/services/superAdminBillingService';
import { mockPlatformSettings } from '../../superadmin/data/mockSuperAdminData';

export const PlanUpgradeModal = ({
  isOpen,
  onClose,
  title = 'Plan Limit Exceeded',
  featureName = 'Feature',
  currentPlan = 'Starter QR',
  limitText = '',
  message = 'Please purchase this plan to perform this action.',
  initialPlan = null,
}) => {
  const [step, setStep] = useState('PLANS'); // 'PLANS' | 'PAYMENT' | 'SUCCESS'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInvoice, setSubmittedInvoice] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        setStep('PAYMENT');
        setSelectedPlan({
          id: initialPlan.id || 'plan-growth',
          name: initialPlan.name || 'Growth Pro',
          rawPrice: initialPlan.monthlyPrice || initialPlan.rawPrice || 2499,
          price: initialPlan.price || `₹${(initialPlan.monthlyPrice || initialPlan.rawPrice || 2499).toLocaleString()}/mo`,
        });
      } else {
        setStep('PLANS');
        setSelectedPlan(null);
      }
      setUtrNumber('');
    }
  }, [isOpen, initialPlan]);

  if (!isOpen) return null;

  const saSettings = storage.get(STORAGE_KEYS.SUPERADMIN_SETTINGS, mockPlatformSettings) || mockPlatformSettings;
  const superAdminUpiId = saSettings.upiId || 'progixtechnology@upi';
  const superAdminQrUrl = saSettings.upiQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${superAdminUpiId}%26pn=Progix%20SaaS`;
  const bankName = saSettings.bankName || 'HDFC Bank';
  const accountHolder = saSettings.accountHolder || 'Progix Technology Pvt Ltd';
  const accountNumber = saSettings.accountNumber || '50200012345678';
  const ifscCode = saSettings.ifscCode || 'HDFC0001234';
  const gstId = saSettings.taxId || '29AAFCO1234F1Z8';

  const plansComparison = [
    {
      id: 'plan-starter',
      name: 'Starter QR',
      rawPrice: 999,
      price: '₹999/mo',
      badge: 'Basic',
      tables: '10 Tables',
      dishes: '30 Dishes',
      admins: '1 Admin Login',
      staff: '0 Staff Accounts',
      analytics: 'Disabled',
      color: 'border-slate-200 bg-slate-50 hover:border-slate-300',
    },
    {
      id: 'plan-growth',
      name: 'Growth Pro',
      rawPrice: 2499,
      price: '₹2,499/mo',
      badge: 'Recommended',
      tables: '30 Tables',
      dishes: '60 Dishes',
      admins: '4 Admin Logins',
      staff: '4 Staff Accounts',
      analytics: 'Basic Reports',
      color: 'border-indigo-300 bg-indigo-50/50 shadow-sm hover:border-indigo-400',
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise Scale',
      rawPrice: 4999,
      price: '₹4,999/mo',
      badge: 'High Volume',
      tables: '50 Tables',
      dishes: '100+ Dishes',
      admins: '8 Admin Logins',
      staff: '8 Staff Accounts',
      analytics: 'Full Analytics & CRM',
      color: 'border-emerald-300 bg-emerald-50/50 shadow-sm hover:border-emerald-400',
    },
  ];

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    setStep('PAYMENT');
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(superAdminUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsSubmitting(true);

    const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
    const tenantId = session?.restaurantId || 'tenant-001';
    const restaurantName = session?.restaurantName || session?.restaurantSlug || 'The Spice Garden';

    try {
      const finalUtr = utrNumber || `UTR-${Date.now().toString().slice(-6)}`;
      const inv = await superAdminBillingService.generateInvoice(
        {
          id: tenantId,
          name: restaurantName,
          planName: selectedPlan.name,
          planAmount: selectedPlan.rawPrice,
          billingCycle: 'MONTHLY',
        },
        selectedPlan,
        {
          status: 'PENDING',
          utrNumber: finalUtr,
          requestedPlanId: selectedPlan.id,
          requestedPlanName: selectedPlan.name,
          notificationRead: false,
          adminName: session?.user?.name || session?.name || 'Restaurant Admin',
        }
      );

      setSubmittedInvoice(inv);
      setStep('SUCCESS');
    } catch (err) {
      console.error('Failed to submit payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('PLANS');
    setSelectedPlan(null);
    setUtrNumber('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dark backdrop blur overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleResetAndClose}
      />

      {/* Modal Dialog Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/80 animate-fade-in my-auto overflow-hidden text-slate-900 max-h-[90vh] overflow-y-auto"
      >
        {/* Top Glow Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── STEP 1: PLANS CATALOG ────────────────────────────────────────── */}
        {step === 'PLANS' && (
          <>
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
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Available Plans & Features
                </h4>
                <span className="text-[10px] text-amber-700 font-bold">Select any plan to pay & upgrade →</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plansComparison.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handleChoosePlan(plan)}
                    className={`p-3.5 rounded-2xl border transition-all ${plan.color} relative flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-md group`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-amber-800">
                          {plan.name}
                        </span>
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
                    <div className="mt-3 pt-2 border-t border-slate-200/60 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChoosePlan(plan);
                        }}
                        className="w-full py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Select & Pay UPI</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 text-center sm:text-left">
                Select a plan card above to complete QR / Bank payment.
              </p>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleChoosePlan(plansComparison[2])}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pay for Enterprise Plan</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: UPI QR & BANK PAYMENT SCREEN ─────────────────────────── */}
        {step === 'PAYMENT' && selectedPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep('PLANS')}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Plans</span>
              </button>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                Step 2 of 2: Pay SuperAdmin
              </span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Scan QR Code or Pay via Bank Transfer
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Purchasing <span className="font-bold text-amber-700">{selectedPlan.name}</span> Package ({selectedPlan.price})
              </p>
            </div>

            {/* SuperAdmin QR & UPI Box */}
            <div className="bg-gradient-to-br from-amber-50/90 to-yellow-50/40 p-4 rounded-2xl border border-amber-200/80 text-center space-y-3 shadow-inner">
              <img
                src={superAdminQrUrl}
                alt="SuperAdmin Payment QR Code"
                className="w-44 h-44 mx-auto rounded-2xl border-2 border-amber-400 p-1.5 bg-white shadow-md object-contain"
              />

              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">SuperAdmin Official UPI ID:</span>
                <code className="bg-white px-2 py-1 rounded-md border border-amber-300 font-mono font-bold text-slate-900 shadow-2xs">
                  {superAdminUpiId}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold transition-colors cursor-pointer"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* SuperAdmin Direct Bank Transfer & GST Details */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 font-bold text-slate-900">
                <span className="flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-amber-600" />
                  Official Bank Transfer Credentials (IMPS / NEFT)
                </span>
                <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-black">
                  GSTIN: {gstId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Bank Name</span>
                  <strong className="text-slate-900">{bankName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Holder</span>
                  <strong className="text-slate-900">{accountHolder}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Number</span>
                  <strong className="text-slate-900 font-mono">{accountNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">IFSC Branch Code</span>
                  <strong className="text-slate-900 font-mono">{ifscCode}</strong>
                </div>
              </div>
            </div>

            {/* Transaction UTR Input Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Payment Transaction / UTR Ref No.
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 987654321098 or UPI Ref ID"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{isSubmitting ? 'Submitting Recharge Request...' : 'I Have Made Payment (Submit Request)'}</span>
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 3: RECHARGE REQUEST CONFIRMATION MESSAGE ─────────────────── */}
        {step === 'SUCCESS' && (
          <div className="py-2 space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                Recharge Request Submitted
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Your recharge request has been submitted successfully!
              </h3>
              <p className="text-xs font-bold text-amber-950 max-w-sm mx-auto leading-relaxed pt-1 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                Your {selectedPlan?.name} plan will be activated within 30 minutes once payment is verified.
              </p>
            </div>

            {/* Submitted Invoice Summary Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Plan Requested:</span>
                <span className="font-extrabold text-slate-900">{selectedPlan?.name} ({selectedPlan?.price})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Invoice Ref ID:</span>
                <span className="font-mono font-bold text-slate-800">{submittedInvoice?.id || 'INV-2026-9918'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">UTR / Ref No:</span>
                <span className="font-mono font-bold text-slate-800">{submittedInvoice?.utrNumber || 'Submitted'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Status:</span>
                <span className="font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[10px] uppercase">
                  Pending SuperAdmin Approval
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full py-3 bg-slate-900 text-white text-xs font-extrabold rounded-xl shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
