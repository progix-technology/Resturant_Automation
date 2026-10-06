import React from 'react';

export const Skeleton = ({ className = '', rounded = 'rounded-xl' }) => {
  return (
    <div
      className={`bg-charcoal-200/60 animate-pulse ${rounded} ${className}`}
      aria-hidden="true"
    />
  );
};

export const FoodCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-3 border border-warm-200 shadow-card flex gap-3.5 items-center">
      <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-sm" />
          <Skeleton className="w-28 h-4 rounded" />
        </div>
        <Skeleton className="w-full h-3 rounded" />
        <Skeleton className="w-2/3 h-3 rounded" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="w-16 h-5 rounded" />
          <Skeleton className="w-18 h-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
