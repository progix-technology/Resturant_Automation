import React from 'react';
import { Check, Clock, Utensils, Bell, CheckCircle2 } from 'lucide-react';
import { ORDER_STATUS } from '../../constants/orderStatuses';
import { PAYMENT_STATUS } from '../../constants/paymentStatuses';

export const OrderTimeline = ({
  orderStatus = ORDER_STATUS.RECEIVED,
  paymentStatus = PAYMENT_STATUS.PENDING,
}) => {
  // Compute step active status based on state
  const isPaid = paymentStatus === PAYMENT_STATUS.COMPLETED;

  // Ordering of stages
  const statusLevels = {
    [ORDER_STATUS.RECEIVED]: 1,
    [ORDER_STATUS.CONFIRMED]: 2,
    [ORDER_STATUS.PREPARING]: 3,
    [ORDER_STATUS.READY]: 4,
    [ORDER_STATUS.SERVED]: 5,
  };

  const currentLevel = statusLevels[orderStatus] || 1;

  const steps = [
    {
      id: 'received',
      title: 'Order Received',
      subtitle: 'Sent to restaurant kitchen',
      completed: true,
      current: currentLevel === 1 && !isPaid,
      icon: Check,
    },
    {
      id: 'payment',
      title: 'Payment Completed',
      subtitle: isPaid ? 'UPI / Cash Verified' : 'Payment awaiting confirmation',
      completed: isPaid,
      current: !isPaid,
      icon: CheckCircle2,
    },
    {
      id: 'confirmed',
      title: 'Order Confirmed',
      subtitle: currentLevel >= 2 ? 'Kitchen accepted your order' : 'Pending kitchen acceptance',
      completed: currentLevel >= 2,
      current: currentLevel === 2 && isPaid,
      icon: Utensils,
    },
    {
      id: 'preparing',
      title: 'Preparing Food',
      subtitle: currentLevel >= 3 ? 'Freshly cooking on stove' : 'In cooking queue',
      completed: currentLevel >= 4,
      current: currentLevel === 3,
      icon: Clock,
    },
    {
      id: 'ready',
      title: 'Ready to Serve',
      subtitle: currentLevel >= 4 ? 'Plated & awaiting table runner' : 'Awaiting plating',
      completed: currentLevel >= 5,
      current: currentLevel === 4,
      icon: Bell,
    },
    {
      id: 'served',
      title: 'Served to Table',
      subtitle: currentLevel >= 5 ? 'Enjoy your delicious meal!' : 'Will be brought to your table',
      completed: currentLevel >= 5,
      current: currentLevel === 5,
      icon: Check,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-warm-200 shadow-card">
      <h3 className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-4">
        Live Order Tracker
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-3 before:w-0.5 before:bg-warm-200">
        {steps.map((step) => {
          let nodeBg = 'bg-warm-200 text-charcoal-400 border-2 border-white';
          if (step.completed) {
            nodeBg = 'bg-brand-800 text-white shadow-xs';
          } else if (step.current) {
            nodeBg = 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse';
          }

          return (
            <div key={step.id} className="relative flex items-start gap-3.5">
              {/* Timeline circle node */}
              <div
                className={`
                  absolute -left-6 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300
                  ${nodeBg}
                `}
              >
                {step.completed ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>

              {/* Text metadata */}
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold leading-tight ${
                    step.completed
                      ? 'text-charcoal-900'
                      : step.current
                      ? 'text-amber-800 font-extrabold'
                      : 'text-charcoal-400'
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  {step.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
