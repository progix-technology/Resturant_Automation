import React from 'react';

export const Loader = ({ text = 'Welcome to the restaurant...', fullScreen = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-6 p-4">
      <div className="cube-spinner">
        <div />
        <div />
        <div />
        <div />
        <div />
        <div />
      </div>
      {text && (
        <p className="text-sm sm:text-base font-semibold text-charcoal-700 tracking-wide animate-pulse-subtle">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-100/95 backdrop-blur-md">
        {spinner}
      </div>
    );
  }

  return <div className="py-12 flex justify-center items-center">{spinner}</div>;
};
