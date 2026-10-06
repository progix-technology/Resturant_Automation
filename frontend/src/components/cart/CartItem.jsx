import React from 'react';
import { VegIndicator } from '../menu/VegIndicator';
import { QuantitySelector } from '../menu/QuantitySelector';
import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../hooks/useCart';

export const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="bg-white rounded-2xl p-4 border border-warm-200/90 shadow-2xs flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        {/* Left: Indicator & Dish info */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="mt-1">
            <VegIndicator isVeg={item.isVeg} size="sm" />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-charcoal-900 leading-snug">
              {item.name}
            </h4>
            <p className="text-xs text-charcoal-500 font-medium mt-0.5">
              Base: {formatCurrency(item.price)}
            </p>

            {/* Selected Add-ons list */}
            {item.selectedAddons && item.selectedAddons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {item.selectedAddons.map((addon) => (
                  <span
                    key={addon.id}
                    className="inline-flex items-center text-[10px] font-medium bg-warm-100 text-charcoal-700 px-2 py-0.5 rounded-md border border-warm-200"
                  >
                    +{addon.name} ({formatCurrency(addon.price)})
                  </span>
                ))}
              </div>
            )}

            {/* Special Instructions */}
            {item.specialInstructions && (
              <p className="text-[11px] text-amber-700 italic mt-1 bg-amber-50/80 px-2 py-0.5 rounded-md inline-block">
                "{item.specialInstructions}"
              </p>
            )}
          </div>
        </div>

        {/* Right: Line Item Total */}
        <div className="text-sm font-extrabold text-charcoal-900 shrink-0">
          {formatCurrency(item.itemTotal)}
        </div>
      </div>

      {/* Bottom row: Stepper & Remove */}
      <div className="flex items-center justify-between pt-2 border-t border-warm-100">
        <button
          type="button"
          onClick={() => removeItem(item.cartItemId)}
          className="text-xs font-semibold text-charcoal-400 hover:text-red-600 transition-colors"
        >
          Remove
        </button>

        <QuantitySelector
          quantity={item.quantity}
          onIncrement={() => updateQuantity(item.cartItemId, item.quantity + 1)}
          onDecrement={() => updateQuantity(item.cartItemId, item.quantity - 1)}
          size="sm"
          showTrashOnMin={true}
        />
      </div>
    </div>
  );
};
