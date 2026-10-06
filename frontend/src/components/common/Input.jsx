import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  required = false,
  prefix,
  suffix,
  className = '',
  inputClassName = '',
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-charcoal-700 tracking-wide uppercase flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-charcoal-400">
            {prefix}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full h-12 px-4 rounded-xl text-sm md:text-base font-normal text-charcoal-900 bg-white
            border transition-all duration-150 outline-none
            placeholder:text-charcoal-400
            ${prefix ? 'pl-11' : 'pl-4'}
            ${suffix ? 'pr-11' : 'pr-4'}
            ${error
              ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100'
              : 'border-warm-300 focus:border-brand-700 focus:ring-2 focus:ring-brand-100'
            }
            ${disabled ? 'bg-charcoal-100 text-charcoal-400 cursor-not-allowed' : ''}
            ${inputClassName}
          `}
          {...props}
        />

        {suffix && (
          <div className="absolute right-3.5 flex items-center pointer-events-none text-charcoal-400">
            {suffix}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs font-medium text-red-600 flex items-center gap-1 mt-0.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600"></span>
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-charcoal-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
