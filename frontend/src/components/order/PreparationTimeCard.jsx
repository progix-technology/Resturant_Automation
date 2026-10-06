import React from 'react';
import { Clock, MessageSquareQuote, Sparkles } from 'lucide-react';

export const PreparationTimeCard = ({
  estimatedMinutes = 20,
  orderStatus,
  className = '',
}) => {
  const isServed = orderStatus === 'SERVED';
  const isReady = orderStatus === 'READY';

  return (
    <div className={`rounded-2xl p-5 bg-gradient-to-br from-brand-900 to-brand-800 text-white shadow-card ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
            {isServed ? (
              <Sparkles className="w-5 h-5 text-amber-300" />
            ) : (
              <Clock className="w-5 h-5 text-warm-200" />
            )}
          </div>
          <div>
            <p className="text-xs text-warm-200 uppercase tracking-wider font-semibold">
              {isServed ? 'Status' : isReady ? 'Food Ready' : 'Estimated Time'}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isServed ? 'Order Served!' : isReady ? 'On the way to Table' : `~ ${estimatedMinutes} Minutes`}
            </h3>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-white/10 flex items-start gap-2 text-xs text-warm-200/90 leading-relaxed">
        <MessageSquareQuote className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          Further order updates and receipts are automatically dispatched to your WhatsApp.
        </p>
      </div>
    </div>
  );
};
