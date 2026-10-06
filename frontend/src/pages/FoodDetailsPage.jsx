import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Plus, Check } from 'lucide-react';
import { menuService } from '../services/menuService';
import { useCart } from '../hooks/useCart';
import { FoodImage } from '../components/menu/FoodImage';
import { VegIndicator } from '../components/menu/VegIndicator';
import { QuantitySelector } from '../components/menu/QuantitySelector';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { ErrorState } from '../components/common/ErrorState';
import { formatCurrency } from '../utils/currency';

export const FoodDetailsPage = () => {
  const { restaurantSlug, itemId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await menuService.getItemById(itemId, restaurantSlug);
        setItem(data);
      } catch (err) {
        setError(err.message || 'Food item not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItem();
  }, [itemId, restaurantSlug]);

  if (isLoading) {
    return <Loader fullScreen text="Loading dish details..." />;
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center p-4">
        <ErrorState
          title="Dish Not Found"
          message={`Could not find the dish details.`}
          onRetry={() => navigate(`/menu/${restaurantSlug}/home`)}
        />
      </div>
    );
  }

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
    navigate(`/menu/${restaurantSlug}/home`);
  };

  return (
    <div className="min-h-screen bg-warm-100 max-w-lg mx-auto flex flex-col justify-between antialiased">
      <div>
        {/* Top Header */}
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => navigate(`/menu/${restaurantSlug}/home`)}
            className="w-10 h-10 rounded-xl bg-white border border-warm-200 flex items-center justify-center text-charcoal-800 shadow-2xs"
            aria-label="Back to menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-charcoal-900 truncate">
            {item.name}
          </h1>
        </div>

        {/* Hero Food Image */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-warm-200">
          <FoodImage
            src={item.image}
            alt={item.name}
            className="w-full h-full"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs p-1.5 rounded-xl shadow-xs">
            <VegIndicator isVeg={item.isVeg} size="md" />
          </div>
        </div>

        {/* Content Box */}
        <div className="p-5 bg-white rounded-t-3xl -mt-6 relative z-10 border-t border-warm-200 shadow-card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-charcoal-900">
              {item.name}
            </h2>
            <span className="text-xl font-black text-brand-800 shrink-0">
              {formatCurrency(item.price)}
            </span>
          </div>

          {item.preparationTime && (
            <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
              <Clock className="w-4 h-4 text-brand-700" />
              <span>Average prep time: {item.preparationTime}</span>
            </div>
          )}

          <p className="text-sm text-charcoal-600 leading-relaxed">
            {item.description}
          </p>

          {/* Add-ons */}
          {item.addons && item.addons.length > 0 && (
            <div className="pt-3 border-t border-warm-200">
              <h3 className="text-sm font-bold text-charcoal-900 mb-2">
                Available Add-ons
              </h3>
              <div className="space-y-2">
                {item.addons.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <label
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`
                        flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
                        ${isSelected ? 'border-brand-700 bg-brand-50/70 text-charcoal-900' : 'border-warm-200 bg-white text-charcoal-700'}
                      `}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`
                            w-5 h-5 rounded-md flex items-center justify-center border
                            ${isSelected ? 'bg-brand-800 border-brand-800 text-white' : 'border-charcoal-300'}
                          `}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{addon.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-charcoal-900">
                        +{formatCurrency(addon.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div className="pt-3 border-t border-warm-200">
            <label className="text-xs font-semibold text-charcoal-700 mb-1.5 block">
              Cooking Instructions (optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, well done..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-300 bg-white text-xs sm:text-sm text-charcoal-900 outline-none focus:border-brand-700"
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-warm-200 flex items-center gap-3">
        <QuantitySelector
          quantity={quantity}
          onIncrement={() => setQuantity((q) => q + 1)}
          onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
          size="lg"
        />

        <Button
          onClick={handleAddToCart}
          variant="primary"
          size="lg"
          fullWidth
          className="shadow-floating flex justify-between"
        >
          <span>Add to Cart</span>
          <span>{formatCurrency(totalPrice)}</span>
        </Button>
      </div>
    </div>
  );
};
