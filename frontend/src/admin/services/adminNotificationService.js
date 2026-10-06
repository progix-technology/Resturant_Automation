import { mockNotificationTemplates } from '../data/mockAdminData';
import { storage } from '../../utils/storage';
import { simulateDelay, apiRequest } from '../../services/apiConfig';
import { whatsappHelper } from '../../utils/whatsappHelper';

const RECENT_NOTIFS_KEY = 'restaurant_admin_recent_notifications';

export const adminNotificationService = {
  async getTemplates() {
    return [...mockNotificationTemplates];
  },

  async getRecentNotifications() {
    const list = storage.get(RECENT_NOTIFS_KEY, []);
    return list;
  },

  async sendAutomatedWhatsApp({ mobile, customerName, orderId, tableNumber, total, type, restaurantName, upiVpa, restaurantSlug, googleReviewUrl }) {
    try {
      const res = await apiRequest('/notifications/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          mobile,
          customerName,
          orderId,
          tableNumber,
          total,
          type,
          restaurantName,
          upiVpa,
          restaurantSlug,
          googleReviewUrl,
        }),
      });

      const newNotification = {
        id: `notif-${Date.now()}`,
        templateName: type === 'TABLE_BILL' ? 'Pre-Serving Table Invoice' : 'Google Rating Request',
        recipient: mobile || customerName || 'Diner',
        message: res.text || 'WhatsApp alert dispatched',
        status: 'DELIVERED',
        sentAt: new Date().toISOString(),
        whatsappUrl: res.whatsappUrl,
      };

      const history = storage.get(RECENT_NOTIFS_KEY, []);
      storage.set(RECENT_NOTIFS_KEY, [newNotification, ...history].slice(0, 50));

      return res;
    } catch (err) {
      console.warn('Backend WhatsApp dispatch notification warning:', err.message);
      return {
        success: true,
        message: 'WhatsApp notification logged',
      };
    }
  },

  async sendWhatsAppTemplate(templateId, variables = {}, recipientMobile = '', openChat = false) {
    await simulateDelay(200);
    const templates = await this.getTemplates();
    const tpl = templates.find((t) => t.id === templateId);

    if (!tpl) throw new Error('Template not found');

    let renderedText = tpl.template;
    Object.entries(variables).forEach(([k, v]) => {
      renderedText = renderedText.replaceAll(`{{${k}}}`, v);
    });

    const newNotification = {
      id: `notif-${Date.now()}`,
      templateId,
      templateName: tpl.name,
      recipient: recipientMobile || 'Diner',
      message: renderedText,
      status: 'DELIVERED',
      sentAt: new Date().toISOString(),
    };

    console.log(
      `%c[Admin WhatsApp Notification Dispatched]%c\nTo: ${recipientMobile}\n${renderedText}`,
      'color: #10B981; font-weight: bold;',
      'color: inherit;'
    );

    if (openChat && recipientMobile) {
      whatsappHelper.openWhatsAppChat(recipientMobile, renderedText);
    }

    const history = storage.get(RECENT_NOTIFS_KEY, []);
    storage.set(RECENT_NOTIFS_KEY, [newNotification, ...history].slice(0, 50));

    return newNotification;
  },
};
