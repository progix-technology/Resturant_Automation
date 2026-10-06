import React from 'react';

export const Divider = ({ className = '', label }) => {
  if (label) {
    return (
      <div className={`relative flex py-2 items-center ${className}`}>
        <div className="flex-grow border-t border-warm-200"></div>
        <span className="flex-shrink mx-3 text-xs text-charcoal-400 uppercase tracking-wider font-semibold">
          {label}
        </span>
        <div className="flex-grow border-t border-warm-200"></div>
      </div>
    );
  }

  return <hr className={`border-0 border-t border-warm-200 my-3 ${className}`} />;
};
