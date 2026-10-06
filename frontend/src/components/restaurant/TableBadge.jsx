import React from 'react';
import { Armchair } from 'lucide-react';

export const TableBadge = ({ tableNumber, className = '' }) => {
  if (!tableNumber) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200/80 font-semibold text-xs tracking-tight ${className}`}>
      <Armchair className="w-3.5 h-3.5 text-brand-700" />
      <span>Table {tableNumber}</span>
    </div>
  );
};
