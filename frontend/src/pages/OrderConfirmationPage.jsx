import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, MessageSquare, CreditCard, ArrowRight, Clock, Armchair, ChevronRight } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { formatCurrency } from '../utils/currency';
import { Button } from '../components/common/Button';

export const OrderConfirmationPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { activeOrder } = useOrder();

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

  return (
    <div className="space-y-5 animate-fade-in pb-12 text-center max-w-md mx-auto">
      {/* Celebration Icon */}
      <div className="pt-4 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 ring-8 ring-emerald-50 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
          Order Sent to Kitchen
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-2 tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-600 mt-1 max-w-xs">
          Your order has been received by the chefs and is being prepared with care.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-warm-200 shadow-card text-left space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-warm-100">
          <div>
            <p className="text-[11px] text-charcoal-400 font-semibold uppercase">Order Number</p>
            <p className="text-lg font-black text-charcoal-900">#{activeOrder.orderId}</p>
          </div>

          <div className="text-right">
            <p className="text-[11px] text-charcoal-400 font-semibold uppercase">Table</p>
            <div className="flex items-center gap-1 text-sm font-bold text-brand-800">
              <Armchair className="w-4 h-4" />
              <span>Table {activeOrder.tableNumber}</span>
            </div>
          </div>
        </div>

        {/* Item count & total */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-charcoal-600">Total Payable</span>
          <span className="text-xl font-black text-brand-800">
            {formatCurrency(activeOrder.total)}
          </span>
        </div>

        {/* WhatsApp Notification Card */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-950">
          <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Please keep WhatsApp available on <strong>+91 {activeOrder.mobile}</strong> for digital payment receipts and status alerts.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={() => navigate(`/menu/${restaurantSlug}/payment`)}
          variant="primary"
          size="lg"
          fullWidth
          icon={CreditCard}
          className="shadow-floating text-base"
        >
          Pay Now with UPI / QR
        </Button>

        <Button
          onClick={() => navigate(`/menu/${restaurantSlug}/order-status`)}
          variant="outline"
          size="md"
          fullWidth
          icon={Clock}
        >
          Track Kitchen Status
        </Button>

        <button
          onClick={() => navigate(`/menu/${restaurantSlug}/home`)}
          className="text-xs font-bold text-charcoal-500 hover:text-charcoal-800 pt-1 flex items-center justify-center gap-1 mx-auto"
        >
          <span>Continue Browsing Menu</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
