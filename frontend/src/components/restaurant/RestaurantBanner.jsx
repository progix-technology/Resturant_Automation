import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Badge } from '../common/Badge';

export const RestaurantBanner = ({ restaurant, className = '' }) => {
  if (!restaurant) return null;

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-card bg-charcoal-900 text-white ${className}`}>
      {/* Background Image with warm gradient overlay */}
      <div className="relative h-44 sm:h-52 w-full">
        <img
          src={restaurant.banner}
          alt={restaurant.name}
          className="w-full h-full object-cover object-center brightness-75"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-900/50 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-brand-600/90 text-white text-[11px] font-semibold tracking-wide uppercase">
              {restaurant.cuisine?.split('•')[0] || 'Dine-In'}
            </span>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{restaurant.rating}</span>
              <span className="text-charcoal-300 font-normal">({restaurant.reviewCount}+)</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {restaurant.name}
          </h1>

          <p className="text-xs sm:text-sm text-warm-200/90 mt-1 line-clamp-1">
            {restaurant.tagline}
          </p>
        </div>

        {/* Operating status badge */}
        <div className="shrink-0 hidden xs:flex">
          <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Open Now
          </Badge>
        </div>
      </div>
    </div>
  );
};
