import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { apiRequest } from '../../services/apiConfig';
import { notificationService } from '../../services/notificationService';

const ADMIN_ORDERS_KEY = 'restaurant_admin_all_orders';

const isDummyOrder = (o) => {
  if (!o) return true;
  return false;
};

const getCurrentSlug = () => {
  const session = storage.get(STORAGE_KEYS.ADMIN_SESSION, null);
  return (session?.restaurantSlug || 'spice-garden').toLowerCase().trim();
};

const matchesSlug = (orderSlug, currentSlug) => {
  if (!orderSlug) return true;
  const s = orderSlug.toLowerCase().replace(/^the-/, '');
  const c = currentSlug.toLowerCase().replace(/^the-/, '');
  return s === c;
};

export const adminOrderService = {
  /**
   * Retrieves all orders strictly from live backend API / MongoDB Atlas for active restaurant
   * Fallback to real customer orders stored in local storage
   */
  async getOrders() {
    const currentSlug = getCurrentSlug();
    let backendOrders = [];
    try {
      const res = await apiRequest(`/orders?slug=${currentSlug}`);
      if (res && res.data && Array.isArray(res.data)) {
        backendOrders = res.data;
      }
    } catch (err) {
      console.warn('Backend orders fetch failed, reading stored real orders:', err.message);
    }

    // Clean dummy activeOrder or history from local storage if present
    const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER);
    if (activeOrder && isDummyOrder(activeOrder)) {
      storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
    }

    const customerHistory = storage.get(STORAGE_KEYS.ORDER_HISTORY, []);
    if (Array.isArray(customerHistory)) {
      const cleanedHistory = customerHistory.filter((o) => !isDummyOrder(o));
      if (cleanedHistory.length !== customerHistory.length) {
        storage.set(STORAGE_KEYS.ORDER_HISTORY, cleanedHistory);
      }
    }

    // Merge backend orders, cached orders, and real customer orders for this restaurant
    const orderMap = new Map();

    // 1. Put backend orders first (excluding dummy & matching current restaurant)
    backendOrders.forEach((o) => {
      if (isDummyOrder(o)) return;
      if (!matchesSlug(o.restaurantSlug, currentSlug)) return;
      const id = o.orderId || o.id;
      if (id) orderMap.set(id, o);
    });

    // 2. Put cached admin orders if matching restaurant
    const cachedOrders = storage.get(`${ADMIN_ORDERS_KEY}_${currentSlug}`, []);
    if (Array.isArray(cachedOrders)) {
      cachedOrders.forEach((o) => {
        if (isDummyOrder(o)) return;
        if (!matchesSlug(o.restaurantSlug, currentSlug)) return;
        const id = o.orderId || o.id;
        if (id && !orderMap.has(id)) {
          orderMap.set(id, o);
        }
      });
    }

    // 3. Merge active customer order from this browser (if real & matching)
    const freshActive = storage.get(STORAGE_KEYS.ACTIVE_ORDER);
    if (freshActive && !isDummyOrder(freshActive) && matchesSlug(freshActive.restaurantSlug, currentSlug) && (freshActive.orderId || freshActive.id)) {
      const id = freshActive.orderId || freshActive.id;
      if (!orderMap.has(id)) {
        orderMap.set(id, freshActive);
        apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify({ ...freshActive, restaurantSlug: currentSlug }),
        }).catch(() => {});
      } else {
        const existing = orderMap.get(id);
        const isBackendCompleted = existing.paymentStatus === 'COMPLETED' || existing.orderStatus === 'SERVED' || existing.orderStatus === 'COMPLETED' || existing.orderStatus === 'CANCELLED';
        if (!isBackendCompleted) {
          orderMap.set(id, { ...existing, ...freshActive });
        }
      }
    }

    // 4. Merge clean customer history orders matching restaurant
    const cleanHistory = storage.get(STORAGE_KEYS.ORDER_HISTORY, []);
    if (Array.isArray(cleanHistory)) {
      cleanHistory.forEach((custOrder) => {
        if (isDummyOrder(custOrder)) return;
        if (!matchesSlug(custOrder.restaurantSlug, currentSlug)) return;
        const id = custOrder?.orderId || custOrder?.id;
        if (id) {
          if (!orderMap.has(id)) {
            orderMap.set(id, custOrder);
            apiRequest('/orders', {
              method: 'POST',
              body: JSON.stringify({ ...custOrder, restaurantSlug: currentSlug }),
            }).catch(() => {});
          } else {
            const existing = orderMap.get(id);
            const isBackendCompleted = existing.paymentStatus === 'COMPLETED' || existing.orderStatus === 'SERVED' || existing.orderStatus === 'COMPLETED' || existing.orderStatus === 'CANCELLED';
            if (!isBackendCompleted) {
              orderMap.set(id, { ...existing, ...custOrder });
            }
          }
        }
      });
    }

    const merged = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    storage.set(`${ADMIN_ORDERS_KEY}_${currentSlug}`, merged);
    return merged;
  },

  /**
   * Resets all orders and caches to 0 (Clean Slate)
   */
  async resetAllOrders() {
    try {
      await apiRequest('/orders/reset', { method: 'POST' });
    } catch (err) {
      console.warn('Backend orders reset warning:', err.message);
    }
    storage.remove(ADMIN_ORDERS_KEY);
    storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
    storage.remove(STORAGE_KEYS.ORDER_HISTORY);
    storage.remove(STORAGE_KEYS.GUEST_SESSION);
    storage.remove(STORAGE_KEYS.ADMIN_TABLES);
    return [];
  },

  /**
   * Retrieves single order by ID
   */
  async getOrderById(orderId) {
    try {
      const res = await apiRequest(`/orders/${orderId}`);
      if (res && res.data) return res.data;
    } catch (err) {
      // Fallback
    }

    const orders = await this.getOrders();
    const found = orders.find((o) => (o.orderId || o.id) === orderId);
    if (!found) throw new Error(`Order #${orderId} not found`);
    return found;
  },

  /**
   * Updates an order status with customer sync
   */
  async updateOrderStatus(orderId, nextStatus, metadata = {}) {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, ...metadata }),
      });
    } catch (err) {
      console.warn('Backend status update failed, saving locally:', err.message);
    }

    const orders = await this.getOrders();
    const index = orders.findIndex((o) => (o.orderId || o.id) === orderId);
    
    const updated = index !== -1 ? {
      ...orders[index],
      orderStatus: nextStatus,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      ...metadata,
    } : {
      orderId,
      id: orderId,
      orderStatus: nextStatus,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      ...metadata,
    };

    if (index !== -1) {
      orders[index] = updated;
      storage.set(ADMIN_ORDERS_KEY, orders);
    }

    // Sync with customer local session if matching
    const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER);
    if (activeOrder && (activeOrder.orderId || activeOrder.id) === orderId) {
      storage.set(STORAGE_KEYS.ACTIVE_ORDER, {
        ...activeOrder,
        orderStatus: nextStatus,
        status: nextStatus,
        ...metadata,
      });
    }

    const history = storage.get(STORAGE_KEYS.ORDER_HISTORY, []);
    if (Array.isArray(history)) {
      const updatedHistory = history.map((o) =>
        (o.orderId || o.id) === orderId
          ? { ...o, orderStatus: nextStatus, status: nextStatus, ...metadata }
          : o
      );
      storage.set(STORAGE_KEYS.ORDER_HISTORY, updatedHistory);
    }

    // Notify customer
    try {
      if (nextStatus === 'CONFIRMED') {
        notificationService.orderConfirmed(orderId, metadata.etaMinutes || 25);
      } else if (nextStatus === 'PREPARING') {
        notificationService.kitchenPreparing(orderId);
      } else if (nextStatus === 'READY') {
        notificationService.orderReady(orderId);
      } else if (nextStatus === 'SERVED') {
        notificationService.orderServed(orderId);
      }
    } catch (notifyErr) {
      console.warn('Notification error:', notifyErr);
    }

    return updated;
  },

  /**
   * Mark order payment completed
   */
  async markPaid(orderId, method = 'UPI', markServed = true) {
    try {
      await apiRequest(`/orders/${orderId}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({ method, markServed }),
      });
    } catch (err) {
      console.warn('Backend payment status update failed, saving locally:', err.message);
    }

    const orders = await this.getOrders();
    const index = orders.findIndex((o) => (o.orderId || o.id) === orderId);

    const updated = index !== -1 ? {
      ...orders[index],
      paymentStatus: 'COMPLETED',
      paymentMethod: method,
      paidAt: new Date().toISOString(),
      ...(markServed ? { orderStatus: 'SERVED' } : {}),
    } : {
      orderId,
      id: orderId,
      paymentStatus: 'COMPLETED',
      paymentMethod: method,
      paidAt: new Date().toISOString(),
      ...(markServed ? { orderStatus: 'SERVED' } : {}),
    };

    if (index !== -1) {
      orders[index] = updated;
      storage.set(ADMIN_ORDERS_KEY, orders);
    }

    // Sync active customer order
    const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER);
    if (activeOrder && (activeOrder.orderId || activeOrder.id) === orderId) {
      storage.set(STORAGE_KEYS.ACTIVE_ORDER, {
        ...activeOrder,
        paymentStatus: 'COMPLETED',
        paymentMethod: method,
        ...(markServed ? { orderStatus: 'SERVED' } : {}),
      });
    }

    const history = storage.get(STORAGE_KEYS.ORDER_HISTORY, []);
    if (Array.isArray(history)) {
      const updatedHistory = history.map((o) =>
        (o.orderId || o.id) === orderId
          ? {
              ...o,
              paymentStatus: 'COMPLETED',
              paymentMethod: method,
              ...(markServed ? { orderStatus: 'SERVED' } : {}),
            }
          : o
      );
      storage.set(STORAGE_KEYS.ORDER_HISTORY, updatedHistory);
    }

    return updated;
  },

  /**
   * Set or update preparation ETA in minutes
   */
  async setPreparationTime(orderId, minutes) {
    return this.updateOrderStatus(orderId, 'PREPARING', { etaMinutes: minutes });
  },

  /**
   * Delete order by ID
   */
  async deleteOrder(orderId) {
    const cleanId = String(orderId).replace('#', '').trim();
    try {
      await apiRequest(`/orders/${cleanId}`, { method: 'DELETE' });
    } catch (e) {}

    const currentSlug = getCurrentSlug();
    const cached = storage.get(`${ADMIN_ORDERS_KEY}_${currentSlug}`, []);
    if (Array.isArray(cached)) {
      const filtered = cached.filter((o) => (o.orderId || o.id) !== cleanId && (o.orderId || o.id) !== `#${cleanId}` && (o.orderId || o.id) !== orderId);
      storage.set(`${ADMIN_ORDERS_KEY}_${currentSlug}`, filtered);
    }

    const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER);
    if (activeOrder && ((activeOrder.orderId || activeOrder.id) === cleanId || (activeOrder.orderId || activeOrder.id) === orderId)) {
      storage.remove(STORAGE_KEYS.ACTIVE_ORDER);
    }

    const history = storage.get(STORAGE_KEYS.ORDER_HISTORY, []);
    if (Array.isArray(history)) {
      const filteredHistory = history.filter((o) => (o.orderId || o.id) !== cleanId && (o.orderId || o.id) !== orderId);
      storage.set(STORAGE_KEYS.ORDER_HISTORY, filteredHistory);
    }

    return true;
  },
};
