import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [activeOrder, setActiveOrder] = useState(() => {
    // If no guest session exists, do not retain active order
    const hasSession = storage.get(STORAGE_KEYS.GUEST_SESSION, null);
    if (!hasSession) {
      storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
      return null;
    }
    return storage.get(STORAGE_KEYS.ACTIVE_ORDER, null);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeOrder) {
      storage.set(STORAGE_KEYS.ACTIVE_ORDER, activeOrder);
    } else {
      storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
    }
  }, [activeOrder]);

  const placeOrder = async ({ session, cart }) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeSession = session || storage.get(STORAGE_KEYS.GUEST_SESSION, {}) || {};
      const orderPayload = {
        sessionId: activeSession.sessionId,
        restaurantId: activeSession.restaurantId || 'rest-001',
        restaurantSlug: (activeSession.restaurantSlug || 'spice-garden').replace(/^the-/, ''),
        customerName: activeSession.customerName || 'Guest Diner',
        mobile: activeSession.mobile || '',
        tableNumber: activeSession.tableNumber || '01',
        items: cart?.items || [],
        subtotal: cart?.subtotal || 0,
        tax: cart?.tax || 0,
        total: cart?.total || 0,
      };

      const createdOrder = await orderService.createOrder(orderPayload);
      setActiveOrder(createdOrder);
      return createdOrder;
    } catch (err) {
      console.error('Failed to create order:', err);
      setError(err.message || 'Failed to place order');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrder = async (orderId) => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await orderService.getOrder(orderId);
      setActiveOrder(order);
      return order;
    } catch (err) {
      console.error(`Failed to load order ${orderId}:`, err);
      setError(err.message || 'Order not found');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const simulatePaymentSuccess = async () => {
    if (!activeOrder?.orderId) return;
    setIsLoading(true);
    try {
      const updated = await paymentService.simulatePaymentSuccess(activeOrder.orderId);
      setActiveOrder({ ...updated });
      return updated;
    } catch (err) {
      console.error('Payment simulation failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const simulateOrderStatus = async (newStatus) => {
    if (!activeOrder?.orderId) return;
    setIsLoading(true);
    try {
      const updated = await orderService.updateOrderStatus(activeOrder.orderId, newStatus);
      setActiveOrder({ ...updated });
      return updated;
    } catch (err) {
      console.error('Order status simulation failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearActiveOrder = () => {
    setActiveOrder(null);
    storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
  };

  return (
    <OrderContext.Provider
      value={{
        activeOrder,
        isLoading,
        error,
        placeOrder,
        loadOrder,
        simulatePaymentSuccess,
        simulateOrderStatus,
        clearActiveOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
};
