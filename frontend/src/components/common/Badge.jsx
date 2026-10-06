import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  icon: Icon,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const variants = {
    brand: 'bg-brand-50 text-brand-800 border border-brand-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-red-50 text-red-800 border border-red-200',
    neutral: 'bg-charcoal-100 text-charcoal-700 border border-charcoal-200',
    bestseller: 'bg-amber-100 text-amber-900 font-semibold border border-amber-300',
    dark: 'bg-charcoal-900 text-white',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span className={`${baseStyles} ${variants[variant] || variants.neutral} ${sizes[size] || sizes.sm} ${className}`}>
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </span>
  );
};
