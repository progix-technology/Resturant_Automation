import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { PaymentQRCode } from '../components/payment/PaymentQRCode';
import { PaymentStatus } from '../components/payment/PaymentStatus';
import { Button } from '../components/common/Button';
import { formatCurrency } from '../utils/currency';
import { PAYMENT_STATUS } from '../constants/paymentStatuses';

import { GoogleRatingCard } from '../components/common/GoogleRatingCard';

export const PaymentPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { activeOrder, simulatePaymentSuccess, isLoading } = useOrder();
  const [successAnimation, setSuccessAnimation] = useState(false);

  if (!activeOrder) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-charcoal-500">No active order to pay for.</p>
        <Button onClick={() => navigate(`/menu/${restaurantSlug}/home`)} variant="outline">
          Back to Menu
        </Button>
      </div>
    );
  }

  const isPaid = activeOrder.paymentStatus === PAYMENT_STATUS.COMPLETED;

  const handleConfirmDone = async () => {
    try {
      await simulatePaymentSuccess();
      setSuccessAnimation(true);
    } catch (err) {
      console.error('Payment confirmation failed:', err);
    }
  };

  const handleNotDone = () => {
    // Customer chose Not Done / Pay Later: Go directly to tracking
    navigate(`/menu/${restaurantSlug}/order-status`);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 max-w-md mx-auto">
      {/* Top Status */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider">
            Order Reference
          </span>
          <h1 className="text-lg font-black text-charcoal-900">
            #{activeOrder.orderId}
          </h1>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider">
            Table
          </span>
          <p className="text-sm font-bold text-brand-800">
            Table {activeOrder.tableNumber}
          </p>
        </div>
      </div>

      {/* Payment Status Pill */}
      <PaymentStatus status={activeOrder.paymentStatus} />

      {/* When Paid -> Show Celebration & Google Rating Card */}
      {isPaid || successAnimation ? (
        <div className="space-y-4 animate-fade-in">
          {/* Confirmed Banner */}
          <div className="bg-emerald-900 text-white rounded-3xl p-5 border border-emerald-700/50 shadow-lg text-center space-y-2 relative overflow-hidden">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Payment Confirmed & Order Served
              </span>
              <h2 className="text-xl font-black text-white mt-1.5">
                Payment Received via UPI!
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Paid {formatCurrency(activeOrder.total)} • Table {activeOrder.tableNumber}
              </p>
            </div>
          </div>

          {/* Instant Google Review & Rating Card */}
          <GoogleRatingCard
            customerName={activeOrder.customerName || 'Guest'}
            restaurantName="The Spice Garden"
            googleReviewUrl="https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4"
          />

          {/* Action to view receipt / tracker */}
          <div className="pt-1">
            <Button
              onClick={() => navigate(`/menu/${restaurantSlug}/order-status`)}
              variant="outline"
              size="lg"
              fullWidth
              icon={ArrowRight}
              className="bg-white border-slate-300 text-slate-800 font-bold hover:bg-slate-50"
            >
              View Order Receipt & Dining Details
            </Button>
          </div>
        </div>
      ) : (
        /* Unpaid QR UI with Done / Not Done actions */
        <PaymentQRCode
          order={activeOrder}
          onConfirmDone={handleConfirmDone}
          onNotDone={handleNotDone}
          onSimulateSuccess={handleConfirmDone}
          isLoading={isLoading}
        />
      )}

      {/* Bottom Back to Status Link if not paid */}
      {!isPaid && !successAnimation && (
        <div className="pt-2 text-center">
          <button
            onClick={handleNotDone}
            className="text-xs font-semibold text-charcoal-500 hover:text-brand-800 underline"
          >
            I haven't paid yet, take me to Order Kitchen Tracker
          </button>
        </div>
      )}
    </div>
  );
};
