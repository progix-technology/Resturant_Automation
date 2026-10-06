import React from 'react';

export const IconButton = ({
  icon: Icon,
  label,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-brand-800 text-white hover:bg-brand-900 focus:ring-brand-700',
    secondary: 'bg-warm-200 text-charcoal-800 hover:bg-warm-300 focus:ring-warm-400',
    ghost: 'text-charcoal-600 hover:bg-warm-200 hover:text-charcoal-900 focus:ring-warm-300',
    outline: 'border border-warm-300 text-charcoal-700 hover:bg-warm-100 focus:ring-brand-700',
    danger: 'text-red-600 hover:bg-red-50 focus:ring-red-400',
  };

  const sizes = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2 min-w-[40px]',
    lg: 'w-12 h-12 p-3 min-w-[48px]',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.ghost} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      <Icon className="w-full h-full shrink-0" />
    </button>
  );
};
