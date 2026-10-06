import React from 'react';
import { FoodCard } from './FoodCard';

export const MenuSection = ({
  categoryTitle,
  items = [],
  onOpenDetails,
  className = '',
}) => {
  if (!items.length) return null;

  return (
    <section className={`py-4 ${className}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-lg font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
          <span>{categoryTitle}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warm-200 text-charcoal-600">
            {items.length}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {items.map((item) => (
          <FoodCard
            key={item.id}
            item={item}
            onOpenDetails={onOpenDetails}
          />
        ))}
      </div>
    </section>
  );
};
