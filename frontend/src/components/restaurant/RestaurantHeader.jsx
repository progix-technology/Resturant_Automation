import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Utensils } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { TableBadge } from './TableBadge';

export const RestaurantHeader = ({
  restaurant,
  tableNumber,
  showBack = false,
  onBack,
  title,
  subtitle,
}) => {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const slug = restaurant?.slug || 'spice-garden';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleCartClick = () => {
    navigate(`/menu/${slug}/cart`);
  };

  return (
    <header className="sticky top-0 z-30 bg-warm-100/95 backdrop-blur-md border-b border-warm-200/80 px-4 py-3 transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Back button or Restaurant identity */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl bg-white border border-warm-200 shadow-2xs flex items-center justify-center text-charcoal-700 hover:text-charcoal-900 active:scale-95 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-800 text-white flex items-center justify-center shadow-xs shrink-0">
              {restaurant?.logo ? (
                <img
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Utensils className="w-5 h-5 text-warm-200" />
              )}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-charcoal-900 leading-tight truncate">
              {title || restaurant?.name || 'Restaurant'}
            </h1>
            {subtitle ? (
              <p className="text-xs text-charcoal-500 truncate">{subtitle}</p>
            ) : tableNumber ? (
              <p className="text-xs text-brand-800 font-medium">Table {tableNumber}</p>
            ) : null}
          </div>
        </div>

        {/* Right Side: Table Badge & Cart Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          {!showBack && tableNumber && (
            <div className="hidden xs:block">
              <TableBadge tableNumber={tableNumber} />
            </div>
          )}

          <button
            onClick={handleCartClick}
            className="relative w-11 h-11 rounded-xl bg-white border border-warm-200 shadow-xs flex items-center justify-center text-charcoal-800 hover:text-brand-800 active:scale-95 transition-all"
            aria-label={`View Cart with ${itemCount} items`}
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-brand-800 text-white text-[11px] font-bold flex items-center justify-center border-2 border-warm-100 shadow-xs animate-fade-in">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
