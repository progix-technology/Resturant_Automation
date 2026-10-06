import React from 'react';
import { Armchair, Receipt, Phone } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Badge } from '../common/Badge';
import { ORDER_STATUS_LABELS } from '../../constants/orderStatuses';
import { PAYMENT_STATUS_LABELS } from '../../constants/paymentStatuses';

export const OrderStatusCard = ({ order, className = '' }) => {
  if (!order) return null;

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-warm-200 shadow-card ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-warm-200">
        <div>
          <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">
            Order Reference
          </span>
          <h2 className="text-lg font-black text-charcoal-900 tracking-tight">
            #{order.orderId}
          </h2>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge
            variant={order.paymentStatus === 'COMPLETED' ? 'success' : 'warning'}
            size="sm"
          >
            {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
          </Badge>
          <span className="text-xs font-semibold text-brand-800">
            {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
          </span>
        </div>
      </div>

      {/* Guest & Table Info */}
      <div className="grid grid-cols-2 gap-2 py-3 border-b border-warm-100 text-xs">
        <div className="flex items-center gap-1.5 text-charcoal-600">
          <Armchair className="w-4 h-4 text-brand-700 shrink-0" />
          <span>Table <strong className="text-charcoal-900">{order.tableNumber}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-charcoal-600">
          <Phone className="w-4 h-4 text-charcoal-500 shrink-0" />
          <span className="truncate">+91 {order.mobile}</span>
        </div>
      </div>

      {/* Item List Snapshot */}
      <div className="py-3 space-y-2 text-xs">
        {order.items?.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-charcoal-700">
            <span className="truncate max-w-[200px]">
              <strong className="text-charcoal-900">{item.quantity}x</strong> {item.name}
            </span>
            <span className="font-semibold text-charcoal-900">
              {formatCurrency(item.itemTotal)}
            </span>
          </div>
        ))}
      </div>

      {/* Total row */}
      <div className="pt-3 border-t border-warm-200 flex items-center justify-between">
        <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
          Total Amount
        </span>
        <span className="text-base font-black text-charcoal-900">
          {formatCurrency(order.total)}
        </span>
      </div>
    </div>
  );
};
