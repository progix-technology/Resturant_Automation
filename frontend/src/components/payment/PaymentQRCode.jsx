import React, { useState } from 'react';
import { Smartphone, CheckCircle2, ShieldCheck, Sparkles, ExternalLink, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Button } from '../common/Button';

export const PaymentQRCode = ({
  order,
  onSimulateSuccess,
  onConfirmDone,
  onNotDone,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const amount = order?.total || order?.amount || 0;
  const orderId = order?.orderId || order?.id || 'ORD-001';
  const upiId = order?.upiVpa || order?.upiId || 'spicegarden@upi';
  const restName = order?.restaurantName || 'Spice Garden';

  // NPCI Official Standard Dynamic Amount UPI Link
  const encodedName = encodeURIComponent(restName);
  const encodedNote = encodeURIComponent(`Bill_${orderId}`);
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiUri)}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUpiApp = () => {
    window.location.href = upiUri;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-warm-200 shadow-card text-center flex flex-col items-center">
      {/* Header Info */}
      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
        Dynamic Auto-Amount UPI QR
      </span>

      <h2 className="text-xl font-extrabold text-charcoal-900 tracking-tight">
        Scan to Pay {formatCurrency(amount)}
      </h2>
      <p className="text-xs text-charcoal-500 mt-1 max-w-xs">
        Scanning with Google Pay, PhonePe, Paytm, or BHIM will <strong>AUTOMATICALLY pre-fill exact {formatCurrency(amount)}</strong>!
      </p>

      {/* Realistic Dynamic QR Frame */}
      <div className="relative my-5 p-4 rounded-2xl bg-white border-2 border-emerald-500/30 shadow-md flex flex-col items-center">
        <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-white p-2 flex items-center justify-center">
          <img
            src={qrCodeUrl}
            alt={`Dynamic UPI QR Code for ${formatCurrency(amount)}`}
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Dynamic Amount Badge */}
        <div className="mt-3 px-3 py-1 rounded-full bg-slate-900 text-amber-400 font-mono text-xs font-bold shadow-xs">
          Exact Bill Amount: {formatCurrency(amount)} (Auto-Pre-filled)
        </div>

        {/* UPI Details below QR */}
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <p className="text-xs font-mono font-bold text-charcoal-700">
            UPI: {upiId}
          </p>
          <button
            type="button"
            onClick={handleCopyUpi}
            className="text-[11px] font-bold text-brand-800 hover:underline flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 1-Tap Pay Direct App Launch Button */}
      <button
        type="button"
        onClick={handleOpenUpiApp}
        className="w-full max-w-xs py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all mb-3 cursor-pointer"
      >
        <Smartphone className="w-4 h-4 text-amber-400" />
        <span>Tap to Open PhonePe / GPay (Auto ₹{amount})</span>
      </button>

      {/* Supported UPI Apps logos */}
      <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-charcoal-500 py-1">
        <span className="text-blue-600">Google Pay</span>
        <span>•</span>
        <span className="text-purple-600">PhonePe</span>
        <span>•</span>
        <span className="text-cyan-600">Paytm</span>
        <span>•</span>
        <span className="text-orange-600">BHIM</span>
      </div>

      {/* Security guarantee */}
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>100% Free NPCI Direct Table Payment</span>
      </div>

      {/* Real-time Payment Confirmation Action (Done / Not Done) */}
      <div className="w-full mt-5 pt-4 border-t border-warm-200">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-300 rounded-2xl p-4 shadow-sm text-left space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Have you completed payment of {formatCurrency(amount)}?</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-snug">
            After paying via GPay, PhonePe, or Paytm, click <strong>Done</strong> to notify kitchen & view receipt.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              onClick={onConfirmDone || onSimulateSuccess}
              isLoading={isLoading}
              variant="primary"
              size="md"
              icon={CheckCircle2}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
            >
              Done (I Have Paid)
            </Button>

            <Button
              onClick={onNotDone}
              variant="outline"
              size="md"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
            >
              Not Done (Pay Later)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
