import React from 'react';
import { Check, Clock, Utensils, Bell, ChefHat, Sparkles } from 'lucide-react';
import { ORDER_STATUS } from '../../constants/orderStatuses';

export const OrderTimeline = ({ orderStatus = ORDER_STATUS.RECEIVED }) => {
  // Normalize levels: 1 = RECEIVED, 2 = CONFIRMED, 3 = PREPARING, 4 = READY, 5 = SERVED
  const statusLevels = {
    [ORDER_STATUS.RECEIVED]: 1,
    [ORDER_STATUS.CONFIRMED]: 2,
    [ORDER_STATUS.PREPARING]: 3,
    [ORDER_STATUS.READY]: 4,
    [ORDER_STATUS.SERVED]: 5,
    COMPLETED: 5,
  };

  const currentLevel = statusLevels[orderStatus] || 1;

  const steps = [
    {
      id: 'received',
      level: 1,
      title: 'Order Received',
      subtitle: 'Sent to restaurant kitchen',
      icon: Check,
    },
    {
      id: 'confirmed',
      level: 2,
      title: 'Order Confirmed',
      subtitle: currentLevel >= 2 ? 'Kitchen accepted your order' : 'Pending kitchen acceptance',
      icon: Utensils,
    },
    {
      id: 'preparing',
      level: 3,
      title: 'Preparing Food',
      subtitle: currentLevel >= 3 ? 'Freshly cooking on stove' : 'In cooking queue',
      icon: ChefHat,
    },
    {
      id: 'ready',
      level: 4,
      title: 'Ready to Serve',
      subtitle: currentLevel >= 4 ? 'Plated & awaiting table runner' : 'Awaiting plating',
      icon: Bell,
    },
    {
      id: 'served',
      level: 5,
      title: 'Served to Table',
      subtitle: currentLevel >= 5 ? 'Enjoy your delicious meal!' : 'Will be brought to your table',
      icon: Sparkles,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-warm-200/90 shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-extrabold text-charcoal-400 uppercase tracking-wider">
          Live Kitchen & Dining Tracker
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200/60">
          Step {Math.min(currentLevel, 5)} of 5
        </span>
      </div>

      <div className="space-y-0">
        {steps.map((step, index) => {
          const isCompleted = currentLevel > step.level || (currentLevel === 5 && step.level === 5);
          const isCurrent = currentLevel === step.level && currentLevel < 5;
          const isLast = index === steps.length - 1;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative flex items-start gap-3.5">
              {/* Vertical connector line connecting nodes */}
              {!isLast && (
                <div
                  className={`absolute left-[13px] top-7 bottom-0 w-0.5 transition-colors duration-500 ${
                    currentLevel > step.level ? 'bg-brand-700' : 'bg-slate-200'
                  }`}
                  style={{ height: 'calc(100% - 10px)' }}
                />
              )}

              {/* Node Icon Circle */}
              <div
                className={`
                  relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-brand-800 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-sm animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Step Title & Subtitle */}
              <div className={`min-w-0 pb-6 ${isLast ? 'pb-1' : ''}`}>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm leading-tight ${
                      isCompleted
                        ? 'font-bold text-charcoal-900'
                        : isCurrent
                        ? 'font-extrabold text-brand-800'
                        : 'font-semibold text-slate-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  {isCurrent && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 uppercase tracking-wider">
                      In Progress
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    isCompleted || isCurrent ? 'text-charcoal-500 font-medium' : 'text-slate-400'
                  }`}
                >
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
