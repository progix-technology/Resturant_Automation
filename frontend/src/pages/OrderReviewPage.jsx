import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Armchair, Phone, User, CheckCircle2, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useCart } from '../hooks/useCart';
import { useOrder } from '../hooks/useOrder';
import { Button } from '../components/common/Button';
import { CartSummary } from '../components/cart/CartSummary';
import { formatCurrency } from '../utils/currency';

export const OrderReviewPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const { items, subtotal, tax, total, clearCart } = useCart();
  const { placeOrder, isLoading } = useOrder();
  const [error, setError] = useState(null);

  const handlePlaceOrder = async () => {
    setError(null);
    try {
      const order = await placeOrder({
        session,
        cart: { items, subtotal, tax, total },
      });

      // Clear cart once order is registered
      clearCart();

      // Navigate to order confirmation
      navigate(`/menu/${restaurantSlug}/order-success`);
    } catch (err) {
      console.error('Order placement failed:', err);
      setError('Could not submit order to kitchen. Please retry.');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
          Review & Confirm Order
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 mt-0.5">
          Please verify your table and dish selection before sending to kitchen.
        </p>
      </div>

      {/* Guest & Table Confirmation Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-warm-200 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
          Dining Verification
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-warm-50 border border-warm-200">
            <Armchair className="w-5 h-5 text-brand-800 shrink-0" />
            <div>
              <p className="text-[11px] text-charcoal-500 font-semibold">Table Assigned</p>
              <p className="text-sm font-bold text-brand-900">Table {session?.tableNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-warm-50 border border-warm-200">
            <User className="w-5 h-5 text-brand-800 shrink-0" />
            <div>
              <p className="text-[11px] text-charcoal-500 font-semibold">Customer</p>
              <p className="text-sm font-bold text-charcoal-900 truncate">{session?.customerName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-charcoal-500 px-1">
          <Phone className="w-3.5 h-3.5 text-charcoal-400" />
          <span>Updates to: <strong>+91 {session?.mobile}</strong></span>
        </div>
      </div>

      {/* Itemized Snapshot */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-warm-200 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
          Dishes Ordered ({items.length})
        </h2>

        <div className="divide-y divide-warm-100">
          {items.map((item) => (
            <div key={item.cartItemId} className="py-2.5 flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-bold text-charcoal-900">
                  <span className="text-brand-800 mr-1.5">{item.quantity}x</span>
                  {item.name}
                </p>
                {item.selectedAddons && item.selectedAddons.length > 0 && (
                  <p className="text-[11px] text-charcoal-500 mt-0.5">
                    +{item.selectedAddons.map((a) => a.name).join(', ')}
                  </p>
                )}
                {item.specialInstructions && (
                  <p className="text-[11px] text-amber-700 italic mt-0.5">
                    "{item.specialInstructions}"
                  </p>
                )}
              </div>
              <span className="font-extrabold text-charcoal-900 shrink-0">
                {formatCurrency(item.itemTotal)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bill Breakdown */}
      <CartSummary
        subtotal={subtotal}
        tax={tax}
        total={total}
        itemCount={items.reduce((s, i) => s + i.quantity, 0)}
      />

      {/* WhatsApp Notice */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900 leading-relaxed">
        <MessageSquareQuote className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-0.5">WhatsApp Table Service</p>
          <p className="text-emerald-800">
            Payment instructions and real-time kitchen status will be sent through WhatsApp after order submission.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sticky Bottom Confirmation */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-warm-100/95 backdrop-blur-md border-t border-warm-200">
        <div className="max-w-xl mx-auto">
          <Button
            onClick={handlePlaceOrder}
            isLoading={isLoading}
            variant="primary"
            size="lg"
            fullWidth
            icon={CheckCircle2}
            className="shadow-floating text-base"
          >
            Place Order • {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </div>
  );
};
