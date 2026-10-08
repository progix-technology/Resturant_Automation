import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, ArrowRight, Utensils } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useSession } from '../hooks/useSession';
import { useRestaurant } from '../hooks/useRestaurant';
import { CartItem } from '../components/cart/CartItem';
import { CartSummary } from '../components/cart/CartSummary';
import { CartAddons } from '../components/cart/CartAddons';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { CustomerBadge } from '../components/restaurant/CustomerBadge';

export const CartPage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { items, subtotal, tax, total, itemCount } = useCart();
  const { session } = useSession();
  const { restaurant } = useRestaurant();

  if (itemCount === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your Cart is Empty"
          description="You haven't added any dishes to your order yet. Explore our freshly prepared menu items and customize to your taste."
          actionLabel="Browse Full Menu"
          onAction={() => navigate(`/menu/${restaurantSlug}/home`)}
        />
      </div>
    );
  }

  const handleProceed = () => {
    navigate(`/menu/${restaurantSlug}/review`);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-36 sm:pb-44">
      {/* Top Header Card */}
      {session && (
        <CustomerBadge
          customerName={session.customerName}
          tableNumber={session.tableNumber}
        />
      )}

      {/* Cart Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <span>Items Selected</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold">
              {itemCount}
            </span>
          </h2>

          <button
            onClick={() => navigate(`/menu/${restaurantSlug}/home`)}
            className="text-xs font-bold text-brand-800 hover:text-brand-900 flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add more items</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <CartItem key={item.cartItemId} item={item} />
          ))}
        </div>
      </div>

      {/* Complete Your Meal Quick Add-ons */}
      <CartAddons restaurantSlug={restaurantSlug || session?.restaurantSlug} />

      {/* Bill Breakdown Summary */}
      <CartSummary
        subtotal={subtotal}
        tax={tax}
        total={total}
        itemCount={itemCount}
      />

      {/* WhatsApp disclaimer */}
      <p className="text-xs text-center text-charcoal-500 px-4 leading-relaxed">
        Order confirmation and payment instructions will be presented on the next step.
      </p>

      {/* Sticky Bottom Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-warm-100/95 backdrop-blur-md border-t border-warm-200">
        <div className="max-w-xl mx-auto">
          <Button
            onClick={handleProceed}
            variant="primary"
            size="lg"
            fullWidth
            icon={ArrowRight}
            className="shadow-floating text-base"
          >
            Proceed to Review
          </Button>
        </div>
      </div>
    </div>
  );
};
