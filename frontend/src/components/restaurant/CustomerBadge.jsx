import React from 'react';
import { User, Armchair } from 'lucide-react';

export const CustomerBadge = ({ customerName, tableNumber, className = '' }) => {
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 bg-warm-50 rounded-2xl border border-warm-200/80 shadow-xs ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 shrink-0">
          <User className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-charcoal-500 font-medium">Ordering for</p>
          <p className="text-sm font-bold text-charcoal-900 truncate">
            {customerName || 'Guest'}
          </p>
        </div>
      </div>

      {tableNumber && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-xl border border-warm-200 shadow-2xs font-semibold text-xs text-brand-800">
          <Armchair className="w-3.5 h-3.5 text-brand-700" />
          <span>Table {tableNumber}</span>
        </div>
      )}
    </div>
  );
};
