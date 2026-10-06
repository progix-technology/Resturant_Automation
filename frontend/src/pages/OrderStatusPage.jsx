import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Utensils, CheckCircle2, RefreshCw } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { useSession } from '../hooks/useSession';
import { OrderTimeline } from '../components/order/OrderTimeline';
import { OrderStatusCard } from '../components/order/OrderStatusCard';
import { PreparationTimeCard } from '../components/order/PreparationTimeCard';
import { Button } from '../components/common/Button';
import { ORDER_STATUS } from '../constants/orderStatuses';
import { PAYMENT_STATUS } from '../constants/paymentStatuses';

import { GoogleRatingCard } from '../components/common/GoogleRatingCard';

export const OrderStatusPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { activeOrder, loadOrder, clearActiveOrder, simulatePaymentSuccess, isLoading } = useOrder();
  const { session, clearSession } = useSession();
  const [showQrModal, setShowQrModal] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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
  const isServedOrDone = activeOrder.orderStatus === ORDER_STATUS.SERVED || activeOrder.orderStatus === 'COMPLETED';
  const isDiningComplete = isPaid && isServedOrDone;

  const handleConfirmDone = async () => {
    setIsVerifyingPayment(true);
    try {
      await simulatePaymentSuccess();
    } catch (err) {
      console.error('Payment confirmation error:', err);
    } finally {
      setIsVerifyingPayment(false);
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
                Hope you enjoyed your meal, <span className="font-semibold text-white">{activeOrder.customerName || session?.customerName || 'Guest'}</span>!
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
              <span className="font-semibold text-emerald-300">{activeOrder.paymentMethod || 'UPI / Online'} (Paid)</span>
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

      {/* Unpaid Warning & Instant Done / Not Done Verification Banner */}
      {!isPaid && (
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl border border-amber-200/90 shadow-2xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="text-amber-950 font-bold">
              <p className="text-sm font-extrabold flex items-center gap-1.5">
                <span>Bill Payment Pending</span>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-black">
                  ₹{activeOrder.total}
                </span>
              </p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Scan UPI QR sent on WhatsApp or pay at counter.
              </p>
            </div>

            <Button
              onClick={() => navigate(`/menu/${restaurantSlug}/payment`)}
              size="sm"
              variant="outline"
              className="border-amber-600 text-amber-900 bg-white hover:bg-amber-100 font-bold shrink-0"
            >
              View UPI QR
            </Button>
          </div>

          {/* Customer Done / Not Done Confirmation Box */}
          <div className="pt-2 border-t border-amber-200/80">
            <p className="text-[11px] font-bold text-amber-900 mb-2">
              Have you completed payment via QR or Cash?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isVerifyingPayment}
                onClick={handleConfirmDone}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerifyingPayment ? 'Verifying...' : 'Done (Paid)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {}}
                className="py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
              >
                Not Done (Pay Later)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preparation Time / ETA Hero Card (show only if not completed) */}
      {!isDiningComplete && (
        <PreparationTimeCard
          estimatedMinutes={activeOrder.estimatedMinutes || 20}
          orderStatus={activeOrder.orderStatus}
        />
      )}

      {/* Visual Live Tracker Timeline */}
      <OrderTimeline
        orderStatus={activeOrder.orderStatus}
        paymentStatus={activeOrder.paymentStatus}
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
