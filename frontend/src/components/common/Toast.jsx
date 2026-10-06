import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-charcoal-900 text-white border border-charcoal-800',
    error: 'bg-red-950 text-white border border-red-800',
    info: 'bg-charcoal-900 text-white border border-charcoal-800',
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-fade-in">
      <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl ${bgStyles[type]}`}>
        <div className="flex items-center gap-2.5">
          {icons[type]}
          <span className="text-xs sm:text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-charcoal-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
