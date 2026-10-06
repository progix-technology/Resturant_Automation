import React from 'react';

export const Loader = ({ size = 'md', text = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`
          ${sizeClasses[size] || sizeClasses.md}
          rounded-full border-brand-200 border-t-brand-800 animate-spin
        `}
      />
      {text && (
        <p className="text-xs sm:text-sm font-medium text-charcoal-600 animate-pulse-subtle">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-100/90 backdrop-blur-xs">
        {spinner}
      </div>
    );
  }

  return <div className="py-8 flex justify-center items-center">{spinner}</div>;
};
