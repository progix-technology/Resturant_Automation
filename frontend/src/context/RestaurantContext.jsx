import React, { createContext, useContext, useState, useEffect } from 'react';
import { restaurantService } from '../services/restaurantService';

const RestaurantContext = createContext(null);

export const RestaurantProvider = ({ children }) => {
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRestaurant = async (slug) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await restaurantService.getRestaurant(slug);
      setRestaurant(data);
      return data;
    } catch (err) {
      console.error('Failed to load restaurant:', err);
      setError(err.message || 'Restaurant not found');
      setRestaurant(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        isLoading,
        error,
        loadRestaurant,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};
