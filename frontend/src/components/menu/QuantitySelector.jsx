import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

export const QuantitySelector = ({
  quantity = 1,
  onIncrement,
  onDecrement,
  min = 1,
  showTrashOnMin = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-8 px-1 text-xs gap-1.5',
    md: 'h-10 px-2 text-sm gap-3',
    lg: 'h-12 px-3 text-base gap-4',
  };

  const btnSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const isMin = quantity <= min;

  return (
    <div
      className={`
        inline-flex items-center justify-between rounded-xl bg-warm-100 border border-warm-300 font-semibold text-charcoal-900 select-none
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDecrement();
        }}
        className={`
          ${btnSizes[size] || btnSizes.md}
          rounded-lg flex items-center justify-center transition-colors active:scale-95
          ${isMin && showTrashOnMin ? 'text-red-600 hover:bg-red-50' : 'text-charcoal-700 hover:bg-warm-200'}
        `}
        aria-label="Decrease quantity"
      >
        {isMin && showTrashOnMin ? (
          <Trash2 className={iconSizes[size] || iconSizes.md} />
        ) : (
          <Minus className={iconSizes[size] || iconSizes.md} />
        )}
      </button>

      <span className="font-bold min-w-5 text-center">{quantity}</span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        className={`
          ${btnSizes[size] || btnSizes.md}
          rounded-lg flex items-center justify-center text-brand-800 hover:bg-brand-50 transition-colors active:scale-95
        `}
        aria-label="Increase quantity"
      >
        <Plus className={iconSizes[size] || iconSizes.md} />
      </button>
    </div>
  );
};
