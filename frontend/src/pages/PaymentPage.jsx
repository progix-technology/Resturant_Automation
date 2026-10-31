import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Utensils,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { PaymentQRCode } from '../components/payment/PaymentQRCode';
import { Button } from '../components/common/Button';
import { formatCurrency } from '../utils/currency';
import { PAYMENT_STATUS } from '../constants/paymentStatuses';
import { GoogleRatingCard } from '../components/common/GoogleRatingCard';

export const PaymentPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { activeOrder, loadOrder, isLoading } = useOrder();
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

  const handlePaymentSuccess = async (verifiedOrder) => {
    try {
      if (verifiedOrder && loadOrder) {
        await loadOrder(verifiedOrder.orderId || activeOrder.orderId);
      }
      setSuccessAnimation(true);
    } catch (err) {
      console.error('Payment confirmation handler error:', err);
      setSuccessAnimation(true);
    }
  };

  const handleReturnToTracker = () => {
    navigate(`/menu/${restaurantSlug}/order-status`);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12 max-w-md mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleReturnToTracker}
          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kitchen Tracker</span>
        </button>

        <span className="text-xs font-extrabold text-slate-800">
          Table {activeOrder.tableNumber || '01'}
        </span>

        <button
          type="button"
          onClick={() => navigate(`/menu/${restaurantSlug}/home`)}
          className="text-xs font-bold text-brand-800 hover:underline"
        >
          Menu
        </button>
      </div>

      {/* When Paid -> Show Celebration & Google Rating Card */}
      {isPaid || successAnimation ? (
        <div className="space-y-4 animate-fade-in">
          {/* Confirmed Banner */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-850 to-charcoal-950 text-white rounded-3xl p-6 border border-emerald-700/50 shadow-xl text-center space-y-3 relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Payment Verified & Received
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                Thank You! ₹{activeOrder.total}
              </h2>
              <p className="text-xs text-emerald-200 mt-1">
                Order #{activeOrder.orderId} • Table {activeOrder.tableNumber}
              </p>
            </div>

            <div className="pt-2 text-[11px] text-emerald-200/80">
              Kitchen is preparing your food. Your meal will be served hot!
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
              onClick={handleReturnToTracker}
              variant="primary"
              size="lg"
              fullWidth
              icon={ArrowRight}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              View Kitchen Live Tracker
            </Button>
          </div>
        </div>
      ) : (
        /* Real Razorpay Verified Checkout & Segmented Payment Modes */
        <PaymentQRCode
          order={activeOrder}
          onPaymentSuccess={handlePaymentSuccess}
          onNotDone={handleReturnToTracker}
          isLoading={isLoading}
        />
      )}

      {/* Bottom Back to Status Link if not paid */}
      {!isPaid && !successAnimation && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={handleReturnToTracker}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Return to Order Kitchen Tracker
          </button>
        </div>
      )}
    </div>
  );
};
