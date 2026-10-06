import React from 'react';

export const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const statusStyles = {
    // Order statuses
    RECEIVED: 'bg-sky-50 text-sky-700 border-sky-200',
    CONFIRMED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PREPARING: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
    READY: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    SERVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',

    // Payment statuses
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200',

    // Table statuses
    AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OCCUPIED: 'bg-amber-50 text-amber-800 border-amber-200',
    RESERVED: 'bg-purple-50 text-purple-700 border-purple-200',
    CLEANING: 'bg-blue-50 text-blue-700 border-blue-200',

    // Staff/Account statuses
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const labels = {
    RECEIVED: 'Received',
    CONFIRMED: 'Confirmed',
    PREPARING: 'Preparing',
    READY: 'Ready',
    SERVED: 'Served',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Paid',
    SUCCESS: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    RESERVED: 'Reserved',
    CLEANING: 'Cleaning',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
  };

  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const style = statusStyles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = labels[normalized] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style} ${sizeClasses[size]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{label}</span>
    </span>
  );
};
