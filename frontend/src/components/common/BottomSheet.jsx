import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showClose = true,
}) => {
  // Lock body scroll when open & hide floating bottom navs
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 pt-16 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content Container (Bottom-sheet on mobile, centered modal on tablet/desktop) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className={`
          relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl
          shadow-2xl max-h-[78vh] sm:max-h-[85vh] flex flex-col overflow-hidden
          transition-all duration-200 ease-out
          ${className}
        `}
      >
        {/* Mobile drag handle bar */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-12 h-1.5 bg-charcoal-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-warm-200">
          <h2 className="text-lg font-bold text-charcoal-900 tracking-tight">
            {title}
          </h2>
          {showClose && (
            <IconButton
              icon={X}
              label="Close modal"
              size="sm"
              onClick={onClose}
              className="text-charcoal-500 hover:text-charcoal-900"
            />
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};
