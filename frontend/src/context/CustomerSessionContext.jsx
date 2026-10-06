import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';

const CustomerSessionContext = createContext(null);

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours auto-expiry

export const CustomerSessionProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    const saved = storage.get(STORAGE_KEYS.GUEST_SESSION, null);
    if (!saved) return null;

    // Check if session has a timestamp; if not, assign one now so 2-hour TTL applies
    if (!saved.createdAt) {
      saved.createdAt = new Date().toISOString();
      storage.set(STORAGE_KEYS.GUEST_SESSION, saved);
    }

    // 1. Auto-timeout: Check if session is older than 2 hours
    const ageMs = Date.now() - new Date(saved.createdAt).getTime();
    if (ageMs > SESSION_TIMEOUT_MS) {
      storage.remove(STORAGE_KEYS.GUEST_SESSION);
      storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
      return null;
    }

    // 2. Check if active order was completed and paid more than 2 hours ago
    const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER, null);
    if (
      activeOrder &&
      activeOrder.paymentStatus === 'COMPLETED' &&
      (activeOrder.orderStatus === 'SERVED' || activeOrder.orderStatus === 'COMPLETED')
    ) {
      const finishTime = activeOrder.paidAt || activeOrder.updatedAt || activeOrder.createdAt;
      if (finishTime && Date.now() - new Date(finishTime).getTime() > SESSION_TIMEOUT_MS) {
        storage.remove(STORAGE_KEYS.GUEST_SESSION);
        storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
        return null;
      }
    }

    return saved;
  });

  // Check TTL every 30 seconds
  useEffect(() => {
    const checkExpiry = () => {
      if (session?.createdAt) {
        const isExpired = Date.now() - new Date(session.createdAt).getTime() > SESSION_TIMEOUT_MS;
        if (isExpired) {
          clearSession();
        }
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 30000);
    return () => clearInterval(interval);
  }, [session]);

  // Sync session changes to localStorage
  useEffect(() => {
    if (session) {
      storage.set(STORAGE_KEYS.GUEST_SESSION, session);
    } else {
      storage.remove(STORAGE_KEYS.GUEST_SESSION);
    }
  }, [session]);

  const createSession = ({ customerName, mobile, tableNumber, restaurantSlug, restaurantId = 'rest-001' }) => {
    const newSession = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      restaurantId,
      restaurantSlug,
      customerName: customerName.trim(),
      mobile: String(mobile).trim(),
      tableNumber: String(tableNumber).trim(),
      createdAt: new Date().toISOString(),
    };
    setSession(newSession);
    return newSession;
  };

  const clearSession = () => {
    setSession(null);
    storage.remove(STORAGE_KEYS.GUEST_SESSION);
    storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
  };


  const hasValidSession = (expectedSlug) => {
    if (!session) return false;
    if (expectedSlug && session.restaurantSlug?.toLowerCase() !== expectedSlug.toLowerCase()) {
      return false;
    }
    return Boolean(session.customerName && session.mobile && session.tableNumber);
  };

  return (
    <CustomerSessionContext.Provider
      value={{
        session,
        createSession,
        clearSession,
        hasValidSession,
      }}
    >
      {children}
    </CustomerSessionContext.Provider>
  );
};

export const useCustomerSession = () => {
  const context = useContext(CustomerSessionContext);
  if (!context) {
    throw new Error('useCustomerSession must be used within CustomerSessionProvider');
  }
  return context;
};
