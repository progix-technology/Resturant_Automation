import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PAYMENT_STATUS } from '../../constants/paymentStatuses';

export const PaymentStatus = ({ status = PAYMENT_STATUS.PENDING }) => {
  if (status === PAYMENT_STATUS.COMPLETED) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div className="text-xs">
          <p className="font-bold">Payment Successful ✓</p>
          <p className="text-emerald-700">Your transaction has been verified by the restaurant.</p>
        </div>
      </div>
    );
  }

  if (status === PAYMENT_STATUS.PROCESSING) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-200">
        <Clock className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
        <div className="text-xs">
          <p className="font-bold">Verifying Payment...</p>
          <p className="text-blue-700">Connecting with UPI banking gateway.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
      <Clock className="w-5 h-5 text-amber-600 shrink-0" />
      <div className="text-xs">
        <p className="font-bold">Payment Pending</p>
        <p className="text-amber-700">Scan QR or pay at table to confirm order.</p>
      </div>
    </div>
  );
};
