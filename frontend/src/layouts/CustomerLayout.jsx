import React, { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { RestaurantHeader } from '../components/restaurant/RestaurantHeader';
import { useRestaurant } from '../hooks/useRestaurant';
import { useSession } from '../hooks/useSession';
import { Loader } from '../components/common/Loader';
import { ErrorState } from '../components/common/ErrorState';

import { StickyCartBar } from '../components/cart/StickyCartBar';

export const CustomerLayout = () => {
  const { restaurantSlug } = useParams();
  const { restaurant, isLoading, error, loadRestaurant } = useRestaurant();
  const { session } = useSession();

  useEffect(() => {
    if (restaurantSlug) {
      loadRestaurant(restaurantSlug);
    }
  }, [restaurantSlug]);

  if (isLoading) {
    return <Loader fullScreen text="Loading Restaurant Menu..." />;
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-warm-100 flex items-center justify-center p-4">
        <ErrorState
          title="Restaurant Not Found"
          message={`Could not find restaurant "${restaurantSlug}". Please verify the QR code scanned.`}
          onRetry={() => loadRestaurant(restaurantSlug)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-100 flex flex-col antialiased text-charcoal-900 relative">
      <RestaurantHeader
        restaurant={restaurant}
        tableNumber={session?.tableNumber}
      />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 pb-24 sm:pb-28">
        <Outlet context={{ restaurant }} />
      </main>

      {/* Floating Sticky Cart Bar at Layout Viewport Root */}
      <StickyCartBar restaurantSlug={restaurantSlug || 'spice-garden'} />
    </div>
  );
};
