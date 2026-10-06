import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useCart } from '../hooks/useCart';
import { useOrder } from '../hooks/useOrder';

/**
 * Ensures user has provided name, phone & table before viewing menu / cart
 */
export const RequireSessionGuard = ({ children }) => {
  const { restaurantSlug } = useParams();
  const { hasValidSession } = useSession();

  if (!hasValidSession(restaurantSlug)) {
    return <Navigate to={`/menu/${restaurantSlug}/customer`} replace />;
  }

  return children;
};

/**
 * Ensures cart is not empty before reaching review page
 */
export const RequireCartGuard = ({ children }) => {
  const { restaurantSlug } = useParams();
  const { itemCount } = useCart();

  if (itemCount === 0) {
    return <Navigate to={`/menu/${restaurantSlug}/home`} replace />;
  }

  return children;
};

/**
 * Ensures an active order exists before showing payment or status
 */
export const RequireOrderGuard = ({ children }) => {
  const { restaurantSlug } = useParams();
  const { activeOrder } = useOrder();

  if (!activeOrder || !activeOrder.orderId) {
    return <Navigate to={`/menu/${restaurantSlug}/home`} replace />;
  }

  return children;
};
