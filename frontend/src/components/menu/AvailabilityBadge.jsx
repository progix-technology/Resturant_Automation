import React from 'react';

export const AvailabilityBadge = ({ isAvailable, className = '' }) => {
  if (isAvailable) return null;

  return (
    <div className={`px-2 py-0.5 rounded-md bg-charcoal-900/80 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs ${className}`}>
      Currently Unavailable
    </div>
  );
};
