import React, { useState, useEffect } from 'react';
import { Clock, Plus, Check } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { VegIndicator } from './VegIndicator';
import { QuantitySelector } from './QuantitySelector';
import { FoodImage } from './FoodImage';
import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../hooks/useCart';

export const FoodDetailsSheet = ({
  isOpen,
  onClose,
  item,
}) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Reset state when opening a new item
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedAddons([]);
      setSpecialInstructions('');
    }
  }, [isOpen, item]);

  if (!item) return null;

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);
  const unitPrice = item.price + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(item, quantity, selectedAddons, specialInstructions);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Customize Dish">
      <div className="flex flex-col gap-4">
        {/* Large Food Image */}
        <div className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden relative shadow-xs">
          <FoodImage
            src={item.image}
            alt={item.name}
            className="w-full h-full"
          />
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-1 rounded-lg shadow-xs">
            <VegIndicator isVeg={item.isVeg} size="md" />
          </div>
        </div>

        {/* Title, Prep Time & Base Price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-extrabold text-charcoal-900 leading-snug">
              {item.name}
            </h2>
            <span className="text-lg font-extrabold text-brand-800 shrink-0">
              {formatCurrency(item.price)}
            </span>
          </div>

          {item.preparationTime && (
            <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-1">
              <Clock className="w-3.5 h-3.5 text-brand-700" />
              <span>Avg. prep time: {item.preparationTime}</span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-charcoal-600 mt-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Add-ons Options Section */}
        {item.addons && item.addons.length > 0 && (
          <div className="pt-2 border-t border-warm-200">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-charcoal-900">
                Optional Add-ons
              </h3>
              <span className="text-[11px] text-charcoal-400 font-medium">Select any</span>
            </div>

            <div className="space-y-2">
              {item.addons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id);

                return (
                  <label
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
                      ${isSelected
                        ? 'border-brand-700 bg-brand-50/70 text-charcoal-900'
                        : 'border-warm-200 hover:border-warm-300 bg-white text-charcoal-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-5 h-5 rounded-md flex items-center justify-center border transition-colors
                          ${isSelected ? 'bg-brand-800 border-brand-800 text-white' : 'border-charcoal-300 bg-white'}
                        `}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-medium">{addon.name}</span>
                    </div>

                    <span className="text-sm font-bold text-charcoal-900">
                      +{formatCurrency(addon.price)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Special Instructions Note */}
        <div className="pt-2 border-t border-warm-200">
          <label className="text-xs font-semibold text-charcoal-700 mb-1.5 block">
            Special Instructions (optional)
          </label>
          <input
            type="text"
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g. Less spicy, no onions, extra crispy..."
            maxLength={120}
            className="w-full px-3.5 py-2.5 rounded-xl border border-warm-300 bg-white text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
          />
        </div>

        {/* Bottom Bar: Quantity & Add to Cart CTA */}
        <div className="sticky bottom-0 pt-3 pb-1 bg-white border-t border-warm-200 flex items-center gap-3">
          <QuantitySelector
            quantity={quantity}
            onIncrement={() => setQuantity((q) => q + 1)}
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
            size="lg"
          />

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 h-12 bg-brand-800 hover:bg-brand-900 active:scale-[0.98] text-white rounded-xl font-bold text-sm sm:text-base flex items-center justify-between px-5 shadow-sm transition-all"
          >
            <span>Add to Cart</span>
            <span>{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
