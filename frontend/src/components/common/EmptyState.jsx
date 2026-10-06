import React from 'react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-white/70 border border-warm-200/80 shadow-xs ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-warm-200/80 flex items-center justify-center text-charcoal-500 mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-charcoal-900 mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-charcoal-500 max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
