import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We could not complete your request. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-red-50/50 border border-red-200/80 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-red-950 mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-red-800/80 max-w-sm mb-5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="danger" size="sm" icon={RotateCcw}>
          Try Again
        </Button>
      )}
    </div>
  );
};
