import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${maxWidth} bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200">
            <h3 className="text-base font-bold text-charcoal-900">{title}</h3>
            <IconButton icon={X} label="Close" size="sm" onClick={onClose} />
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
