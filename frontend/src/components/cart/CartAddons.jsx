import React, { useEffect, useState } from 'react';
import { Sparkles, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { menuService } from '../../services/menuService';
import { formatCurrency } from '../../utils/currency';

export const CartAddons = ({ restaurantSlug }) => {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const [addonItems, setAddonItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAddons = async () => {
      try {
        const data = await menuService.getAddonItems(restaurantSlug);
        if (isMounted) {
          setAddonItems(data || []);
        }
      } catch (err) {
        console.warn('Failed to load cart add-ons:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAddons();
    return () => {
      isMounted = false;
    };
  }, [restaurantSlug]);

  if (loading || addonItems.length === 0) return null;

  // Helper to find existing cart item quantity for an addon
  const getQuantityInCart = (addon) => {
    const addonId = addon.id || addon.itemId;
    const found = items.find((i) => (i.id || i.itemId || i.cartItemId?.split('-')[0]) === addonId);
    return found ? found.quantity : 0;
  };

  const handleAdd = (addon) => {
    const itemToAdd = {
      id: addon.id || addon.itemId,
      itemId: addon.itemId || addon.id,
      name: addon.name,
      price: addon.price,
      image: addon.image,
      isVeg: addon.isVeg !== false,
    };
    addItem(itemToAdd);
  };

  const handleIncrement = (addon) => {
    const addonId = addon.id || addon.itemId;
    const found = items.find((i) => (i.id || i.itemId) === addonId);
    if (found) {
      updateQuantity(found.cartItemId, found.quantity + 1);
    } else {
      handleAdd(addon);
    }
  };

  const handleDecrement = (addon) => {
    const addonId = addon.id || addon.itemId;
    const found = items.find((i) => (i.id || i.itemId) === addonId);
    if (found) {
      if (found.quantity <= 1) {
        removeItem(found.cartItemId);
      } else {
        updateQuantity(found.cartItemId, found.quantity - 1);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-warm-200/80 space-y-3 my-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-charcoal-900 tracking-tight">
              Complete Your Meal
            </h3>
            <p className="text-[11px] text-charcoal-500 font-medium">
              Frequently added beverages, extra butter & condiments
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
          Quick Add
        </span>
      </div>

      {/* Horizontal Cards Slider */}
      <div className="flex gap-3 overflow-x-auto pb-1.5 pt-1 scrollbar-none snap-x snap-mandatory">
        {addonItems.map((addon) => {
          const qty = getQuantityInCart(addon);
          const isAdded = qty > 0;

          return (
            <div
              key={addon.id || addon.itemId}
              className={`shrink-0 w-36 sm:w-40 snap-start bg-gradient-to-b from-warm-50/50 to-white rounded-xl p-2.5 border transition-all duration-200 flex flex-col justify-between ${
                isAdded
                  ? 'border-brand-500/50 ring-1 ring-brand-500/20 bg-emerald-50/30'
                  : 'border-warm-200 hover:border-warm-300'
              }`}
            >
              {/* Image / Badge Top */}
              <div className="relative w-full h-20 rounded-lg overflow-hidden bg-warm-100 mb-2">
                <img
                  src={
                    addon.image ||
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={addon.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-bold text-charcoal-700 shadow-2xs">
                  {addon.isVeg !== false ? '🟢 Veg' : '🔴 Non-Veg'}
                </div>
              </div>

              {/* Title & Price */}
              <div className="mb-2">
                <h4 className="text-xs font-bold text-charcoal-900 line-clamp-1 leading-tight">
                  {addon.name}
                </h4>
                <p className="text-xs font-extrabold text-brand-800 mt-0.5">
                  {formatCurrency(addon.price)}
                </p>
              </div>

              {/* Action Button */}
              {!isAdded ? (
                <button
                  type="button"
                  onClick={() => handleAdd(addon)}
                  className="w-full h-8 rounded-lg bg-brand-800 hover:bg-brand-900 active:scale-95 text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD</span>
                </button>
              ) : (
                <div className="w-full h-8 rounded-lg bg-brand-900 text-white font-extrabold text-xs flex items-center justify-between px-2 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleDecrement(addon)}
                    className="p-1 hover:bg-white/20 rounded cursor-pointer transition-colors active:scale-90"
                    title="Reduce quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-extrabold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => handleIncrement(addon)}
                    className="p-1 hover:bg-white/20 rounded cursor-pointer transition-colors active:scale-90"
                    title="Add more"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
