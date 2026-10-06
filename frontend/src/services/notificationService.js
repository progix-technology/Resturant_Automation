import { whatsappHelper } from '../utils/whatsappHelper';
import { storage } from '../utils/storage';
import { API_BASE_URL } from './apiConfig';

const NOTIF_LOG_KEY = 'restaurant_whatsapp_notifications_log';
const API_URL = API_BASE_URL;


const getActiveSlug = (order = {}) => {
  if (order.restaurantSlug) return order.restaurantSlug;
  try {
    const adminSession = storage.get('restaurant_admin_session', null);
    if (adminSession?.restaurantSlug) return adminSession.restaurantSlug;
  } catch {}
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
    const res = await fetch(`${API_URL}/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, mobile, messageText: text }),
    });

    const data = await res.json();

    if (data.success && data.mode === 'AUTOMATIC_BACKGROUND') {
      console.log(`%c[WhatsApp Auto-Send Success for Tenant ${slug} to +91-${mobile}]`, 'color: #25D366; font-weight: bold;');
      return data;
    } else {
      if (openChat || data.fallbackUrl) {
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

  async getWhatsAppStatus(slug = 'spice-garden') {
    try {
      const res = await fetch(`${API_URL}/whatsapp/status?slug=${slug}`);
      return await res.json();
    } catch {
      return { connected: false, status: 'DISCONNECTED', qrCodeDataUrl: null };
    }
  },

  async logoutWhatsApp(slug = 'spice-garden') {
    try {
      const res = await fetch(`${API_URL}/whatsapp/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  async requestPairingCode(mobile, slug = 'spice-garden') {
    try {
      const res = await fetch(`${API_URL}/whatsapp/pair-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, mobile }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || 'Failed to request pairing code' };
    }
  },

  async verifyAdminPassword(email, password) {
    try {
      const res = await fetch(`${API_URL}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || 'Password verification failed' };
    }
  },

  async sendSecurityOtp(mobile, slug = 'spice-garden') {
    try {
      const res = await fetch(`${API_URL}/whatsapp/send-security-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, mobile }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send Security OTP' };
    }
  },

  async verifySecurityOtp(otp, slug = 'spice-garden') {
    try {
      const res = await fetch(`${API_URL}/whatsapp/verify-security-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, otp }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message || 'Failed to verify Security OTP' };
    }
  }
};

