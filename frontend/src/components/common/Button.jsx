import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] select-none disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100';

  const variants = {
    primary: 'bg-brand-800 text-white hover:bg-brand-900 focus:ring-brand-700 shadow-sm active:bg-brand-950',
    secondary: 'bg-warm-200 text-charcoal-800 hover:bg-warm-300 focus:ring-warm-400 active:bg-warm-300',
    outline: 'border-2 border-brand-800 text-brand-800 hover:bg-brand-50 focus:ring-brand-700',
    ghost: 'text-charcoal-700 hover:bg-warm-200 hover:text-charcoal-900 focus:ring-warm-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    accent: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 h-9 gap-1.5',
    md: 'text-sm px-4 py-2.5 h-11 gap-2',
    lg: 'text-base font-semibold px-6 py-3.5 h-13 min-h-[48px] gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
};
