import React from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { RestaurantHeader } from '../components/restaurant/RestaurantHeader';
import { useRestaurant } from '../hooks/useRestaurant';
import { useSession } from '../hooks/useSession';

export const OrderLayout = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { restaurant } = useRestaurant();
  const { session } = useSession();

  return (
    <div className="min-h-screen bg-warm-100 flex flex-col antialiased text-charcoal-900">
      <RestaurantHeader
        restaurant={restaurant}
        tableNumber={session?.tableNumber}
        showBack={true}
        onBack={() => navigate(-1)}
      />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-4 sm:py-6 pb-20">
        <Outlet context={{ restaurant }} />
      </main>
    </div>
  );
};
