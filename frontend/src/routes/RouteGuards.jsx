import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useCart } from '../hooks/useCart';
import { useOrder } from '../hooks/useOrder';

/**
 * Ensures user has provided name, phone & table before viewing menu / cart
 */
export const RequireSessionGuard = ({ children }) => {
  const { restaurantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const { hasValidSession } = useSession();

  // If directly visiting an order via WhatsApp link, pass through
  if (urlOrderId) {
    return children;
  }

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
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const { activeOrder } = useOrder();

  // If orderId is in URL (e.g. clicked WhatsApp bill/status link), allow it so page can fetch & show it!
  if (urlOrderId) {
    return children;
  }

  if (!activeOrder || !activeOrder.orderId) {
    return <Navigate to={`/menu/${restaurantSlug}/home`} replace />;
  }

  return children;
};
