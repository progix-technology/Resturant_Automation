import React from 'react';
import { formatCurrency } from '../../utils/currency';

export const CartSummary = ({
  subtotal = 0,
  tax = 0,
  total = 0,
  itemCount = 0,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl p-4 border border-warm-200/90 shadow-2xs space-y-3 ${className}`}>
      <h3 className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
        Bill Summary
      </h3>

      <div className="space-y-2 text-sm text-charcoal-700">
        <div className="flex items-center justify-between">
          <span>Item Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="font-semibold text-charcoal-900">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between text-charcoal-600">
          <div className="flex items-center gap-1">
            <span>GST & Restaurant Taxes</span>
            <span className="text-[10px] text-charcoal-400 font-semibold">(5%)</span>
          </div>
          <span className="font-semibold text-charcoal-900">{formatCurrency(tax)}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-warm-200 flex items-center justify-between text-base font-extrabold text-charcoal-900">
        <span>To Pay</span>
        <span className="text-lg text-brand-800">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};
