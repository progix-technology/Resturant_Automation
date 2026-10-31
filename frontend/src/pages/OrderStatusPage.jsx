import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Utensils,
  CheckCircle2,
  RefreshCw,
  CreditCard,
  Store,
  Wallet,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { useSession } from '../hooks/useSession';
import { OrderTimeline } from '../components/order/OrderTimeline';
import { OrderStatusCard } from '../components/order/OrderStatusCard';
import { PreparationTimeCard } from '../components/order/PreparationTimeCard';
import { Button } from '../components/common/Button';
import { ORDER_STATUS } from '../constants/orderStatuses';
import { PAYMENT_STATUS } from '../constants/paymentStatuses';
import { orderService } from '../services/orderService';
import { GoogleRatingCard } from '../components/common/GoogleRatingCard';

export const OrderStatusPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { activeOrder, loadOrder, clearActiveOrder } = useOrder();
  const { session, clearSession } = useSession();
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  const [preferenceFeedback, setPreferenceFeedback] = useState('');

  // Poll backend for real-time order status updates set by Admin/Kitchen
  useEffect(() => {
    if (!activeOrder?.orderId) return;
    const interval = setInterval(() => {
      loadOrder(activeOrder.orderId).catch(() => {});
    }, 3500);
    return () => clearInterval(interval);
  }, [activeOrder?.orderId]);

  if (!activeOrder) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-charcoal-500">No active order found.</p>
        <Button onClick={() => navigate(`/menu/${restaurantSlug}/home`)} variant="outline">
          Back to Menu
        </Button>
      </div>
    );
  }

  const isPaid = activeOrder.paymentStatus === PAYMENT_STATUS.COMPLETED;
  const isCashAtCounter =
    activeOrder.paymentMethod === 'CASH_AT_COUNTER' ||
    activeOrder.paymentMethod === 'CASH' ||
    activeOrder.paymentMethod === 'PAY_AT_COUNTER';

  const isServedOrDone =
    activeOrder.orderStatus === ORDER_STATUS.SERVED ||
    activeOrder.orderStatus === 'COMPLETED';
  const isDiningComplete = isPaid && isServedOrDone;

  const handlePayOnline = () => {
    navigate(`/menu/${restaurantSlug}/payment`);
  };

  const handleSelectPayAtCounter = async () => {
    setIsUpdatingPreference(true);
    try {
      await orderService.updatePaymentPreference(activeOrder.orderId, 'CASH_AT_COUNTER');
      setPreferenceFeedback('Cash at Counter selected! Please settle at the counter after dining.');
      loadOrder(activeOrder.orderId).catch(() => {});
    } catch (err) {
      console.warn('Payment preference error:', err);
    } finally {
      setIsUpdatingPreference(false);
    }
  };

  const handleStartNewSession = () => {
    clearActiveOrder();
    clearSession();
    navigate(`/menu/${restaurantSlug}`);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16 max-w-lg mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-black text-charcoal-900 tracking-tight">
            Order Status
          </h1>
          <p className="text-xs text-charcoal-500">
            {isDiningComplete ? 'Dining completed & receipt' : 'Real-time kitchen preparation feed'}
          </p>
        </div>

        <button
          onClick={() => navigate(`/menu/${restaurantSlug}/home`)}
          className="text-xs font-bold text-brand-800 hover:underline"
        >
          Menu
        </button>
      </div>

      {/* DINING COMPLETED & RECEIPT HERO SCREEN */}
      {isDiningComplete && (
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-850 to-charcoal-950 text-white rounded-3xl p-5 shadow-xl border border-emerald-700/50 space-y-4 relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
                  Paid & Completed
                </span>
                <span className="text-[11px] text-emerald-200/80">Table {activeOrder.tableNumber}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Thank You for Dining With Us! 🙏
              </h2>
              <p className="text-xs text-emerald-200/90 leading-snug">
                Hope you enjoyed your meal,{' '}
                <span className="font-semibold text-white">
                  {activeOrder.customerName || session?.customerName || 'Guest'}
                </span>
                !
              </p>
            </div>
          </div>

          {/* Quick Bill Receipt Summary */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between items-center text-emerald-100">
              <span>Order ID:</span>
              <span className="font-mono font-bold text-white">#{activeOrder.orderId}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-100">
              <span>Payment Mode:</span>
              <span className="font-semibold text-emerald-300">
                {activeOrder.paymentMethod || 'UPI / Online'} (Paid)
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm font-bold text-white">
              <span>Total Bill Paid:</span>
              <span className="text-emerald-300">₹{activeOrder.total}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <Button
              onClick={handleStartNewSession}
              variant="primary"
              size="lg"
              fullWidth
              icon={RefreshCw}
              className="bg-emerald-500 hover:bg-emerald-600 text-charcoal-950 font-bold shadow-lg shadow-emerald-500/20 border-0"
            >
              Start New Dining Session
            </Button>

            <p className="text-[11px] text-center text-emerald-200/70">
              Automatic 2-hour timeout active. Session clears when you start a new session or leave.
            </p>
          </div>
        </div>
      )}

      {/* Google Rating & Review Prompt on Dining Complete */}
      {isDiningComplete && (
        <GoogleRatingCard
          customerName={activeOrder.customerName || session?.customerName || 'Valued Guest'}
          restaurantName="The Spice Garden"
          googleReviewUrl="https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4"
        />
      )}

      {/* VERIFIED PAID BADGE (When payment is complete) */}
      {isPaid && !isDiningComplete && (
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-emerald-950">
                Bill Payment Verified (₹{activeOrder.total})
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                Paid via {activeOrder.paymentMethod || 'Razorpay Online'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
            PAID
          </span>
        </div>
      )}

      {/* PAYMENT ACTION CONSOLE (When payment is pending: Pay Online or Pay at Counter) */}
      {!isPaid && (
        <div className="p-4 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 rounded-2xl border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Bill Total
                </span>
                <span className="text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full text-xs font-black">
                  ₹{activeOrder.total}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isCashAtCounter
                  ? 'Cash payment at counter selected. Settle with cashier or pay online anytime.'
                  : 'Pay online via Razorpay / UPI or pay at the billing counter.'}
              </p>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
              {isCashAtCounter ? 'Pay at Counter' : 'Payment Pending'}
            </span>
          </div>

          {/* Action Buttons: Pay Now vs Pay at Counter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-amber-100">
            <button
              type="button"
              onClick={handlePayOnline}
              className="w-full h-10 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Online Now</span>
            </button>

            <button
              type="button"
              disabled={isUpdatingPreference || isCashAtCounter}
              onClick={handleSelectPayAtCounter}
              className={`w-full h-10 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isCashAtCounter
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-extrabold cursor-default'
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
              }`}
            >
              <Wallet className="w-4 h-4 text-slate-600" />
              <span>
                {isUpdatingPreference
                  ? 'Updating...'
                  : isCashAtCounter
                  ? '✓ Cash at Counter Selected'
                  : 'Pay at Counter / Cash'}
              </span>
            </button>
          </div>

          {preferenceFeedback && (
            <p className="text-[11px] text-emerald-700 font-medium bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60 animate-fade-in">
              {preferenceFeedback}
            </p>
          )}
        </div>
      )}

      {/* Preparation Time / ETA Hero Card (show only if not completed) */}
      {!isDiningComplete && (
        <PreparationTimeCard
          estimatedMinutes={activeOrder.estimatedMinutes || activeOrder.etaMinutes || 20}
          orderStatus={activeOrder.orderStatus}
        />
      )}

      {/* Visual Live Tracker Timeline (Sequential 5 Stages) */}
      <OrderTimeline
        orderStatus={activeOrder.orderStatus}
      />

      {/* Itemized Order Details Card */}
      <OrderStatusCard order={activeOrder} />

      {/* Continue Browsing CTA */}
      <div className="pt-2">
        <Button
          onClick={() => navigate(`/menu/${restaurantSlug}/home`)}
          variant="outline"
          size="md"
          fullWidth
          icon={Utensils}
        >
          Continue Browsing Menu
        </Button>
      </div>
    </div>
  );
};
