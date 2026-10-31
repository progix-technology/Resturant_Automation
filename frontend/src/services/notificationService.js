import { whatsappHelper } from '../utils/whatsappHelper';
import { storage } from '../utils/storage';
import { API_BASE_URL, apiRequest } from './apiConfig';

const NOTIF_LOG_KEY = 'restaurant_whatsapp_notifications_log';
const API_URL = API_BASE_URL;


const getActiveSlug = (order = {}) => {
  if (order.restaurantSlug) return order.restaurantSlug;
  try {
    const adminSession = storage.get('restaurant_admin_session', null);
    if (adminSession?.restaurantSlug) return adminSession.restaurantSlug;
  } catch { }
  return 'spice-garden';
};

const logNotification = (type, order, message, mobile, mode = 'AUTOMATIC') => {
  const newNotif = {
    id: `notif-${Date.now()}`,
    type,
    orderId: order?.orderId || order?.id,
    customerName: order?.customerName || 'Guest',
    mobile: mobile || order?.mobile || '',
    message,
    sentAt: new Date().toISOString(),
    status: 'DISPATCHED',
    mode,
  };

  const logs = storage.get(NOTIF_LOG_KEY, []);
  storage.set(NOTIF_LOG_KEY, [newNotif, ...logs].slice(0, 50));
  return newNotif;
};

const dispatchWhatsAppMessage = async (mobile, text, openChat = false, slug = 'spice-garden') => {
  if (!mobile) return;

  try {
    const data = await apiRequest('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify({ slug, mobile, messageText: text }),
    });

    if (data.success && data.mode === 'AUTOMATIC_BACKGROUND') {
      console.log(`%c[WhatsApp Auto-Send Success for Tenant ${slug} to +91-${mobile}]`, 'color: #25D366; font-weight: bold;');
      return data;
    } else {
      // Only open WhatsApp browser tab if openChat is explicitly true (manual admin trigger)
      if (openChat) {
        whatsappHelper.openWhatsAppChat(mobile, text);
      }
      return data;
    }
  } catch (err) {
    console.warn('[WhatsApp Dispatch Fallback]:', err.message);
    if (openChat) {
      whatsappHelper.openWhatsAppChat(mobile, text);
    }
  }
};

export const notificationService = {
  async sendOrderConfirmation(order, openChat = false) {
    const text = whatsappHelper.createOrderConfirmationMessage(order);
    const slug = getActiveSlug(order);
    logNotification('ORDER_CONFIRMATION', order, text, order.mobile);
    return await dispatchWhatsAppMessage(order.mobile, text, openChat, slug);
  },

  async sendPaymentRequest(order, openChat = false) {
    const text = whatsappHelper.createTableBillMessage(order);
    const slug = getActiveSlug(order);
    logNotification('PAYMENT_REQUEST', order, text, order.mobile);
    return await dispatchWhatsAppMessage(order.mobile, text, openChat, slug);
  },

  async sendPaymentConfirmation(order, openChat = false) {
    const text = `Payment of ₹${order.total || 0} confirmed for Order #${order.orderId || order.id}! Your food is being prepared. 👨‍🍳`;
    const slug = getActiveSlug(order);
    logNotification('PAYMENT_CONFIRMATION', order, text, order.mobile);
    return await dispatchWhatsAppMessage(order.mobile, text, openChat, slug);
  },

  async sendPreparationTime(order, etaMinutes = 20, openChat = false) {
    const text = whatsappHelper.createKitchenEtaMessage(order, etaMinutes);
    const slug = getActiveSlug(order);
    logNotification('KITCHEN_ETA', order, text, order.mobile);
    return await dispatchWhatsAppMessage(order.mobile, text, openChat, slug);
  },

  async sendOrderServed(order, openChat = false) {
    const text = whatsappHelper.createGoogleReviewMessage(order);
    const slug = getActiveSlug(order);
    logNotification('ORDER_SERVED', order, text, order.mobile);
    return await dispatchWhatsAppMessage(order.mobile, text, openChat, slug);
  },

  openWhatsAppDirect(mobile, text) {
    return whatsappHelper.openWhatsAppChat(mobile, text);
  },

  async requestWaiter({ tableNumber, customerName, restaurantSlug, notes }) {
    const cleanSlug = (restaurantSlug || 'spice-garden').toLowerCase().trim().replace(/_/g, '-');
    const tableNum = String(tableNumber || '01').replace(/^Table\s*/i, '').trim();

    try {
      const data = await apiRequest('/notifications/waiter-call', {
        method: 'POST',
        body: JSON.stringify({
          tableNumber: tableNum,
          customerName: customerName || 'Guest Diner',
          restaurantSlug: cleanSlug,
          notes: notes || 'Assistance requested at table',
        }),
      });
      return data;
    } catch (err) {
      console.warn('Backend waiter call failed, using local storage:', err.message);
      const newCall = {
        id: `wcall-${Date.now()}`,
        tableNumber: tableNum,
        customerName: customerName || 'Guest Diner',
        restaurantSlug: cleanSlug,
        requestedAt: new Date().toISOString(),
        status: 'PENDING',
      };
      const current = storage.get('restaurant_waiter_calls', []);
      storage.set('restaurant_waiter_calls', [newCall, ...current]);
      return { success: true, data: newCall };
    }
  },

  async getWaiterCalls(slug = 'spice-garden') {
    const cleanSlug = (slug || 'spice-garden').toLowerCase().trim().replace(/_/g, '-');
    try {
      const data = await apiRequest(`/notifications/waiter-calls?slug=${cleanSlug}`);
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    } catch (err) {
      // Fallback
    }

    const current = storage.get('restaurant_waiter_calls', []);
    return current.filter((c) => (c.restaurantSlug || 'spice-garden') === cleanSlug && c.status === 'PENDING');
  },

  async resolveWaiterCall(id, tableNumber, slug = 'spice-garden') {
    const cleanSlug = (slug || 'spice-garden').toLowerCase().trim().replace(/_/g, '-');
    try {
      await apiRequest(`/notifications/waiter-calls/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ tableNumber, slug: cleanSlug }),
      });
    } catch (err) {}

    const current = storage.get('restaurant_waiter_calls', []);
    const updated = current.map((c) => {
      if (c.id === id || (tableNumber && c.tableNumber === String(tableNumber))) {
        return { ...c, status: 'RESOLVED' };
      }
      return c;
    });
    storage.set('restaurant_waiter_calls', updated);
    return true;
  },

  async getWhatsAppStatus(slug = 'spice-garden') {
    try {
      return await apiRequest(`/whatsapp/status?slug=${slug}`);
    } catch {
      return { connected: false, status: 'DISCONNECTED', qrCodeDataUrl: null };
    }
  },

  async logoutWhatsApp(slug = 'spice-garden') {
    try {
      return await apiRequest('/whatsapp/logout', {
        method: 'POST',
        body: JSON.stringify({ slug }),
      });
    } catch {
      return { success: false };
    }
  },

  async requestPairingCode(mobile, slug = 'spice-garden') {
    try {
      return await apiRequest('/whatsapp/pair-code', {
        method: 'POST',
        body: JSON.stringify({ slug, mobile }),
      });
    } catch (err) {
      return { success: false, message: err.message || 'Failed to request pairing code' };
    }
  },

  async verifyAdminPassword(email, password) {
    try {
      return await apiRequest('/auth/verify-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      return { success: false, message: err.message || 'Password verification failed' };
    }
  },

  async sendSecurityOtp(mobile, slug = 'spice-garden') {
    try {
      return await apiRequest('/whatsapp/send-security-otp', {
        method: 'POST',
        body: JSON.stringify({ slug, mobile }),
      });
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send Security OTP' };
    }
  },

  async verifySecurityOtp(otp, slug = 'spice-garden') {
    try {
      return await apiRequest('/whatsapp/verify-security-otp', {
        method: 'POST',
        body: JSON.stringify({ slug, otp }),
      });
    } catch (err) {
      return { success: false, message: err.message || 'Failed to verify Security OTP' };
    }
  }
};

