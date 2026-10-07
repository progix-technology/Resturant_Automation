import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Utensils, Star, MapPin, Clock, Armchair, LogOut, CheckCircle2 } from 'lucide-react';
import { useRestaurant } from '../hooks/useRestaurant';
import { useSession } from '../hooks/useSession';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { ErrorState } from '../components/common/ErrorState';

export const RestaurantWelcomePage = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { restaurant, isLoading, error, loadRestaurant } = useRestaurant();
  const { session, clearSession } = useSession();

  useEffect(() => {
    if (restaurantSlug) {
      loadRestaurant(restaurantSlug);
    }
  }, [restaurantSlug]);

  if (isLoading) {
    return <Loader fullScreen text="Welcome to the restaurant..." />;
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center p-4">
        <ErrorState
          title="Restaurant Not Found"
          message={`We couldn't locate a menu for "${restaurantSlug}". Please re-scan your table QR code.`}
          onRetry={() => loadRestaurant(restaurantSlug)}
        />
      </div>
    );
  }

  const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER, null);
  const isPreviousOrderFinished =
    activeOrder &&
    activeOrder.paymentStatus === 'COMPLETED' &&
    (activeOrder.orderStatus === 'SERVED' || activeOrder.orderStatus === 'COMPLETED');

  const hasSession = session && session.restaurantSlug === restaurantSlug && session.tableNumber;

  const handleStart = () => {
    if (isPreviousOrderFinished) {
      clearSession();
      navigate(`/menu/${restaurantSlug}/customer`);
      return;
    }

    if (hasSession) {
      navigate(`/menu/${restaurantSlug}/home`);
    } else {
      navigate(`/menu/${restaurantSlug}/customer`);
    }
  };

  const handleResetSession = (e) => {
    e.stopPropagation();
    clearSession();
    navigate(`/menu/${restaurantSlug}/customer`);
  };


  return (
    <div className="h-screen sm:h-auto max-h-screen sm:max-h-none bg-warm-100 flex flex-col justify-between max-w-lg mx-auto p-3 sm:p-6 antialiased overflow-hidden">
      {/* Top Branding Section */}
      <div className="pt-1 sm:pt-6 flex flex-col items-center text-center">
        {/* Restaurant Logo */}
        <div className="w-24 h-24 rounded-3xl overflow-hidden bg-brand-800 shadow-xl border-4 border-white mb-2 sm:mb-4 animate-fade-in flex items-center justify-center text-white font-black text-2xl shrink-0">
          {restaurant.logo ? (
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span className="tracking-wider uppercase">
              {restaurant.name ? restaurant.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'SG'}
            </span>
          )}
        </div>

        {/* Restaurant Name & Tagline */}
        <h1 className="text-2xl sm:text-4xl font-black text-charcoal-900 tracking-tight">
          {restaurant.name}
        </h1>
        {restaurant.tagline && restaurant.tagline.trim() && (
          <p className="text-xs sm:text-base text-charcoal-600 mt-1 font-medium max-w-xs line-clamp-1">
            "{restaurant.tagline}"
          </p>
        )}

        {/* Rating and Cuisine Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{restaurant.rating}</span>
            <span className="text-amber-700 font-normal">({restaurant.reviewCount}+ reviews)</span>
          </div>

          <div className="px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-semibold">
            {restaurant.cuisine}
          </div>
        </div>
      </div>

      {/* Center Hero Card */}
      <div className="my-2 sm:my-5 rounded-3xl overflow-hidden shadow-card border border-warm-200 relative bg-white shrink-0">
        <div className="h-48 w-full relative bg-gradient-to-br from-charcoal-900 via-brand-950 to-charcoal-950 flex items-center justify-center">
          {restaurant.banner ? (
            <img
              src={restaurant.banner}
              alt={restaurant.name}
              className="w-full h-full object-cover brightness-90"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-center text-white/80 p-4">
              <Utensils className="w-10 h-10 mx-auto opacity-30 mb-1" />
              <p className="text-xs font-medium tracking-wide uppercase opacity-50">{restaurant.name}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-4 right-4 text-white text-xs flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-warm-200" />
              {restaurant.openTime} – {restaurant.closeTime}
            </span>
            <span
              className={`${
                restaurant.isKitchenOpen !== false ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'
              } font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide flex items-center gap-1.5 shadow-xs backdrop-blur-xs`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${restaurant.isKitchenOpen !== false ? 'bg-emerald-200 animate-pulse' : 'bg-rose-200'}`}></span>
              {restaurant.isKitchenOpen !== false ? 'OPEN NOW' : 'CLOSED NOW'}
            </span>
          </div>

        </div>

        <div className="p-3 text-xs text-charcoal-600 flex items-start gap-2 bg-warm-50/50">
          <MapPin className="w-4 h-4 text-brand-800 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{restaurant.address}</span>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="pb-safe pt-1 space-y-2 sm:space-y-3 shrink-0">
        {hasSession && isPreviousOrderFinished && (
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-charcoal-700 space-y-1 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-950">Dining Completed ({session.customerName})</span>
              </div>
              <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                Table {session.tableNumber}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Your previous order is complete and paid. Tap below to start a fresh dining session.
            </p>
          </div>
        )}

        {hasSession && !isPreviousOrderFinished && (
          <div className="p-2.5 bg-brand-50 rounded-2xl border border-brand-200 text-xs text-charcoal-700 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-700 animate-pulse"></div>
              <span>Logged in as <strong>{session.customerName}</strong></span>
            </div>
            <span className="font-bold text-brand-900 bg-white px-2 py-0.5 rounded-lg border border-brand-200">
              Table {session.tableNumber}
            </span>
          </div>
        )}

        <Button
          onClick={handleStart}
          variant="primary"
          size="lg"
          fullWidth
          icon={ArrowRight}
          className="shadow-floating text-base"
        >
          {isPreviousOrderFinished
            ? 'Start New Dining Session'
            : hasSession
            ? 'Continue to Menu'
            : 'View Menu'}
        </Button>

        {hasSession && (
          <button
            type="button"
            onClick={handleResetSession}
            className="w-full text-center text-xs font-semibold text-brand-800 hover:text-brand-900 hover:underline py-0.5 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Not {session.customerName}? Start Fresh Guest Check-in</span>
          </button>
        )}

        <p className="text-[11px] text-center text-charcoal-400">
          No app download required • Instant contactless ordering
        </p>
      </div>
    </div>
  );
};

