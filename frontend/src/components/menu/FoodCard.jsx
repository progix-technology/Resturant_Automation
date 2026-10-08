import React from 'react';
import { Star } from 'lucide-react';
import { VegIndicator } from './VegIndicator';
import { FoodImage } from './FoodImage';
import { AddButton } from './AddButton';
import { AvailabilityBadge } from './AvailabilityBadge';
import { formatCurrency } from '../../utils/currency';
import { useCart } from '../../hooks/useCart';

export const FoodCard = ({
  item,
  onOpenDetails,
  className = '',
}) => {
  const { addItem, decrementItem, getItemCartQuantity } = useCart();

  if (!item) return null;

  const itemId = item.id || item.itemId;
  const cartCount = getItemCartQuantity(itemId);
  const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
  const hasAddons = hasVariants || (Array.isArray(item.addons) && item.addons.length > 0);
  
  const getVariantSuffix = (name) => {
    if (!name) return '';
    const lower = String(name).toLowerCase().trim();
    if (lower === 'piece') return '/piece';
    if (lower === 'half') return '/half-plate';
    if (lower === 'full') return '/full-plate';
    if (lower === 'quarter') return '/quarter-plate';
    return `/${lower}`;
  };

  const renderPriceText = () => {
    if (!hasVariants) {
      return formatCurrency(item.price);
    }
    return item.variants
      .map((v) => `${formatCurrency(v.price)}${getVariantSuffix(v.name)}`)
      .join('  •  ');
  };

  const handleAddDirect = (e) => {
    e?.stopPropagation();
    if (!item.isAvailable) return;
    if (hasVariants) {
      onOpenDetails(item);
    } else {
      addItem(item, 1, []);
    }
  };

  const handleDecrementDirect = (e) => {
    e?.stopPropagation();
    decrementItem(item.id);
  };

  const handleCustomize = (e) => {
    e?.stopPropagation();
    if (!item.isAvailable) return;
    onOpenDetails(item);
  };

  return (
    <div
      onClick={() => onOpenDetails(item)}
      className={`
        group relative bg-white rounded-2xl p-3.5 sm:p-4 border border-warm-200/90 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer
        ${!item.isAvailable ? 'opacity-70 bg-warm-50/50' : ''}
        ${className}
      `}
    >
      <div className="flex gap-3.5 sm:gap-4 items-start">
        {/* Left Side: Information */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Header row: Veg dot & Rating */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <VegIndicator isVeg={item.isVeg} size="sm" />
            {item.rating && (
              <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{item.rating}</span>
              </div>
            )}
            {item.isRecommended && (
              <span className="text-[10px] font-bold text-brand-800 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                MUST TRY
              </span>
            )}
            {hasVariants && (
              <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                PORTIONS
              </span>
            )}
          </div>

          {/* Dish Name */}
          <h3 className="text-sm sm:text-base font-bold text-charcoal-900 group-hover:text-brand-800 transition-colors line-clamp-1 leading-snug">
            {item.name}
          </h3>

          {/* Price */}
          <div className="text-xs sm:text-sm font-extrabold text-charcoal-900 mt-1 flex items-center gap-1 flex-wrap">
            <span>{renderPriceText()}</span>
          </div>

          {/* Short Description */}
          <p className="text-xs text-charcoal-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Right Side: Food Image & Add button overlay */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-2xs border border-warm-200">
            <FoodImage
              src={item.image}
              alt={item.name}
              aspectRatio="aspect-square"
              className="w-full h-full"
            />
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-charcoal-900/60 flex items-center justify-center p-1 text-center">
                <AvailabilityBadge isAvailable={false} />
              </div>
            )}
          </div>

          {/* Add button sitting nicely at the bottom edge */}
          <div className="-mt-3.5 z-10">
            <AddButton
              isAvailable={item.isAvailable}
              cartCount={cartCount}
              hasAddons={hasAddons}
              onAdd={handleAddDirect}
              onDecrement={handleDecrementDirect}
              onCustomize={handleCustomize}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
