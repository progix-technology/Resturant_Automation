import { simulateDelay, apiRequest } from './apiConfig';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { ORDER_STATUS } from '../constants/orderStatuses';
import { PAYMENT_STATUS } from '../constants/paymentStatuses';
import { notificationService } from './notificationService';

export const orderService = {
  /**
   * Creates a new guest order and synchronizes with live Node.js backend
   */
  async createOrder(orderPayload) {
    let newOrder = null;

    try {
      // 1. Send to live Node.js / Express backend
      const res = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug: orderPayload.restaurantSlug || storage.get(STORAGE_KEYS.GUEST_SESSION)?.restaurantSlug || 'spice-garden',
          customerName: orderPayload.customerName,
          mobile: orderPayload.mobile,
          tableNumber: orderPayload.tableNumber,
          items: orderPayload.items || [],
          subtotal: orderPayload.subtotal || 0,
          taxes: orderPayload.tax || 0,
          total: orderPayload.total || 0,
          paymentMethod: orderPayload.paymentMethod || 'UPI',
          notes: orderPayload.notes,
        }),
      });

      if (res && res.data) {
        newOrder = res.data;
      }
    } catch (err) {
      console.warn('Backend order submission offline, using local storage fallback:', err.message);
    }

    if (!newOrder) {
      // Fallback local order creation
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const orderId = `ORD-${randomSeq}`;

      newOrder = {
        orderId,
        id: orderId,
        sessionId: orderPayload.sessionId,
        restaurantId: orderPayload.restaurantId || 'rest-001',
        restaurantSlug: orderPayload.restaurantSlug || 'spice-garden',
        customerName: orderPayload.customerName,
        mobile: orderPayload.mobile,
        tableNumber: orderPayload.tableNumber,
        items: orderPayload.items || [],
        subtotal: orderPayload.subtotal || 0,
        tax: orderPayload.tax || 0,
        total: orderPayload.total || 0,
        paymentStatus: PAYMENT_STATUS.PENDING,
        orderStatus: ORDER_STATUS.CONFIRMED,
        estimatedMinutes: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Store as active order in storage
    storage.set(STORAGE_KEYS.ACTIVE_ORDER, newOrder);

    // Save to order history list
    const history = storage.get(STORAGE_KEYS.ORDER_HISTORY, []);
    storage.set(STORAGE_KEYS.ORDER_HISTORY, [newOrder, ...history]);

    // Fire single order confirmation notification
    notificationService.sendOrderConfirmation(newOrder);

    return newOrder;
  },

  /**
   * Gets order by ID
   */
  async getOrder(orderId) {
    try {
      const res = await apiRequest(`/orders/${orderId}`);
      if (res && res.data) return res.data;
    } catch (err) {
      // Fallback to local
    }

    const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER);
    if (activeOrder && activeOrder.orderId === orderId) {
      return activeOrder;
    }
    const history = storage.get(STORAGE_KEYS.ORDER_HISTORY, []);
    const found = history.find((o) => o.orderId === orderId);
    if (found) return found;

    const error = new Error(`Order "${orderId}" not found`);
    error.code = 'ORDER_NOT_FOUND';
    throw error;
  },

  /**
   * Updates an order's status (Preparing, Ready, Served)
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      // Fallback to local
    }

    const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER);
    if (activeOrder && activeOrder.orderId === orderId) {
      activeOrder.orderStatus = newStatus;
      activeOrder.updatedAt = new Date().toISOString();
      storage.set(STORAGE_KEYS.ACTIVE_ORDER, activeOrder);

      if (newStatus === ORDER_STATUS.PREPARING) {
        notificationService.sendPreparationTime(activeOrder, activeOrder.estimatedMinutes);
      } else if (newStatus === ORDER_STATUS.READY) {
        notificationService.sendOrderReady(activeOrder);
      } else if (newStatus === ORDER_STATUS.SERVED) {
        notificationService.sendOrderServed(activeOrder);
      }

      return activeOrder;
    }
    throw new Error('Order not found');
  },

  /**
   * Updates an order's payment status
   */
  async updatePaymentStatus(orderId, paymentStatus, markServed = true) {
    try {
      if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
        await apiRequest(`/orders/${orderId}/pay`, {
          method: 'PATCH',
          body: JSON.stringify({ method: 'UPI', markServed }),
        });
      }
    } catch (err) {
      console.warn('Backend payment status update failed, saving locally:', err.message);
    }

    const activeOrder = storage.get(STORAGE_KEYS.ACTIVE_ORDER);
    if (activeOrder && (activeOrder.orderId === orderId || activeOrder.id === orderId)) {
      activeOrder.paymentStatus = paymentStatus;
      activeOrder.updatedAt = new Date().toISOString();

      if (paymentStatus === PAYMENT_STATUS.COMPLETED) {
        if (markServed) {
          activeOrder.orderStatus = ORDER_STATUS.SERVED;
        } else if (activeOrder.orderStatus === ORDER_STATUS.RECEIVED) {
          activeOrder.orderStatus = ORDER_STATUS.CONFIRMED;
        }
      }

      storage.set(STORAGE_KEYS.ACTIVE_ORDER, activeOrder);
      return activeOrder;
    }
    throw new Error('Order not found');
  },
};
