import React from 'react';
import { Plus, Minus } from 'lucide-react';

export const AddButton = ({
  onAdd,
  onDecrement,
  onCustomize,
  isAvailable = true,
  cartCount = 0,
  hasAddons = false,
  className = '',
}) => {
  if (!isAvailable) {
    return (
      <span className="px-3 py-1.5 rounded-xl bg-charcoal-100 text-charcoal-400 text-xs font-semibold cursor-not-allowed border border-charcoal-200 select-none">
        Unavailable
      </span>
    );
  }

  // If item is already in cart, show interactive stepper [-] count [+]
  if (cartCount > 0) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`
            inline-flex items-center justify-between rounded-xl bg-brand-800 text-white shadow-md font-bold text-xs h-9 px-2 gap-2 select-none
            ${className}
          `}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDecrement?.(e);
            }}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all text-white"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <span className="font-extrabold min-w-4 text-center text-sm text-white">
            {cartCount}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.(e);
            }}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-brand-700 active:scale-95 transition-all text-white"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {hasAddons && onCustomize && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCustomize(e);
            }}
            className="text-[10px] text-brand-800 font-bold hover:underline"
          >
            Customise
          </button>
        )}
      </div>
    );
  }

  // Not in cart yet: Clean "+ ADD" button
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAdd(e);
        }}
        className={`
          relative inline-flex items-center justify-center gap-1 px-4 py-1.5 min-h-[36px]
          rounded-xl font-bold text-xs bg-white text-brand-800 border-2 border-brand-800 hover:bg-brand-800 hover:text-white
          active:scale-95 shadow-2xs transition-all duration-150 select-none
          ${className}
        `}
        aria-label="Add item to cart"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>ADD</span>
      </button>

      {hasAddons && onCustomize && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCustomize(e);
          }}
          className="text-[10px] text-charcoal-500 font-medium hover:text-brand-800 transition-colors"
        >
          Customisable
        </button>
      )}
    </div>
  );
};
