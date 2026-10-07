/**
 * 100% Multi-Tenant Dynamic WhatsApp Dispatcher & Link Generator Utility
 * Beautiful, Highly Organized, Premium WhatsApp Message Templates with Dynamic Amount UPI QR Codes
 */

export const formatMobileNumber = (mobile) => {
  if (!mobile) return '';
  const clean = String(mobile).replace(/\D/g, '');
  if (clean.length === 10) return `91${clean}`;
  if (clean.length === 12 && clean.startsWith('91')) return clean;
  return clean;
};

const getRestaurantName = (order = {}, settings = {}) => {
  if (order.restaurantName && order.restaurantName !== 'Restaurant') return order.restaurantName;
  if (settings.restaurantName) return settings.restaurantName;
  if (settings.name) return settings.name;

  try {
    if (typeof window !== 'undefined') {
      const slug = order.restaurantSlug || 'spice-garden';
      const rawStored = window.localStorage.getItem(`restaurant_admin_settings_${slug}`) || window.localStorage.getItem('restaurant_admin_settings');
      if (rawStored) {
        const stored = JSON.parse(rawStored);
        if (stored.restaurantName || stored.name) return stored.restaurantName || stored.name;
      }
    }
  } catch {}

  return 'Spice Garden';
};

const getRestaurantUpi = (order = {}, settings = {}) => {
  return order.upiVpa || order.upiId || settings.upiId || settings.upiVpa || 'spicegarden@okhdfcbank';
};

const getReviewUrl = (order = {}, settings = {}) => {
  return (
    order.googleReviewUrl ||
    settings.googleReviewUrl ||
    'https://search.google.com'
  );
};

export const generateUpiDeepLink = (order = {}, settings = {}) => {
  const upiVpa = getRestaurantUpi(order, settings);
  const restName = getRestaurantName(order, settings);
  const amount = order.total || order.amount || 0;
  const orderId = order.orderId || order.id || 'ORD-001';

  const cleanVpa = upiVpa.trim();
  const encodedName = encodeURIComponent(restName);
  const note = encodeURIComponent(`Bill_${orderId}`);

  return `upi://pay?pa=${cleanVpa}&pn=${encodedName}&am=${amount}&cu=INR&tn=${note}`;
};

export const generateUpiQrCodeUrl = (order = {}, settings = {}) => {
  const upiLink = generateUpiDeepLink(order, settings);
  return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiLink)}`;
};

export const whatsappHelper = {
  /**
   * Opens WhatsApp Web / App with a pre-filled message
   */
  openWhatsAppChat(mobile, text) {
    const formattedNum = formatMobileNumber(mobile);
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = formattedNum
      ? `https://api.whatsapp.com/send?phone=${formattedNum}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
    return whatsappUrl;
  },

  /**
   * Generates Order Confirmation Message (Beautifully Organized)
   */
  createOrderConfirmationMessage(order = {}, settings = {}) {
    const restName = getRestaurantName(order, settings).toUpperCase();
    const itemsList = (order.items || [])
      .map((item) => `🔸 *${item.name}* × ${item.quantity || 1} ── ₹${(item.price || 0) * (item.quantity || 1)}`)
      .join('\n');

    const formattedDate = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return (
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🍽️  *${restName}*  🍽️\n` +
      `*Order Confirmation & Receipt*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hello *${order.customerName || 'Guest'}* 👋\n` +
      `Thank you for ordering with us today!\n\n` +
      `📌 *ORDER DETAILS*\n` +
      `• *Order ID:* \`#${order.orderId || order.id || 'ORD-001'}\`\n` +
      `• *Table No:* \`Table ${order.tableNumber || '01'}\`\n` +
      `• *Date & Time:* \`${formattedDate}\`\n\n` +
      `🛍️ *ORDERED ITEMS*\n` +
      `${itemsList || '🔸 Order items recorded'}\n\n` +
      `──────────────────────────\n` +
      `💰 *TOTAL AMOUNT:* *₹${order.total || 0}*\n` +
      `──────────────────────────\n\n` +
      `👨‍🍳 *STATUS:* \`Received by Kitchen Team\`\n` +
      `Our chef is preparing your food fresh & hot. We will notify you once it's ready!\n\n` +
      `✨ *Enjoy your dining experience at ${getRestaurantName(order, settings)}!*`
    );
  },

  /**
   * Generates Kitchen ETA & Prep Time Message
   */
  createKitchenEtaMessage(order = {}, etaMinutes = 20, settings = {}) {
    const restName = getRestaurantName(order, settings).toUpperCase();
    return (
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔥  *${restName}*  🔥\n` +
      `*Kitchen Preparation Update*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hello *${order.customerName || 'Guest'}* 👋\n` +
      `Your Order \`#${order.orderId || order.id}\` at *Table ${order.tableNumber || '01'}* is now being cooked!\n\n` +
      `⏱️ *ESTIMATED PREP TIME:* \`~${etaMinutes} Minutes\`\n` +
      `👨‍🍳 Chef is preparing your dishes with fresh ingredients. Thank you for your patience! 🙏`
    );
  },

  /**
   * Generates Digital Table Bill with Dynamic Exact-Amount UPI QR Code & 1-Tap Links
   */
  createTableBillMessage(order = {}, settings = {}) {
    const restName = getRestaurantName(order, settings).toUpperCase();
    const upiVpa = getRestaurantUpi(order, settings);
    const amount = order.total || order.amount || 0;
    const orderId = order.orderId || order.id || 'ORD-001';

    const upiDeepLink = generateUpiDeepLink(order, settings);
    const upiQrCodeUrl = generateUpiQrCodeUrl(order, settings);

    const itemsList = (order.items || [])
      .map((item) => `🔸 *${item.name}* × ${item.quantity || 1} ── ₹${(item.price || 0) * (item.quantity || 1)}`)
      .join('\n');

    return (
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾  *${restName}*  🧾\n` +
      `*Digital Table Invoice & Bill*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hello *${order.customerName || 'Guest'}* 👋\n` +
      `Your meal for *Table ${order.tableNumber || '01'}* (Order \`#${orderId}\`) is hot & ready!\n\n` +
      `📋 *BILL BREAKDOWN*\n` +
      `${itemsList || '🔸 Food & Beverages'}\n\n` +
      `──────────────────────────\n` +
      `💳 *GRAND TOTAL PAYABLE:* *₹${amount}*\n` +
      `📌 *PAYMENT STATUS:* ${order.paymentStatus === 'COMPLETED' ? '✅ *PAID*' : '⏳ *PENDING*'}\n` +
      `──────────────────────────\n\n` +
      `📲 *PAYMENT QR CODE (Auto-Fills Exact ₹${amount}):*\n` +
      `${upiQrCodeUrl}\n\n` +
      `⚡ *1-Tap GPay/PhonePe App Direct Pay:*\n` +
      `${upiDeepLink}\n\n` +
      `👉 *UPI VPA:* \`${upiVpa}\`\n\n` +
      `*Scanning the QR code or tapping the UPI link above will AUTOMATICALLY PRE-FILL EXACT ₹${amount} in Google Pay, PhonePe, Paytm & BHIM!* 🛎️`
    );
  },

  /**
   * Generates Google Review / Feedback Request Message
   */
  createGoogleReviewMessage(order = {}, settings = {}) {
    const restName = getRestaurantName(order, settings);
    const reviewUrl = getReviewUrl(order, settings);

    return (
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `⭐  *${restName.toUpperCase()}*  ⭐\n` +
      `*How was your dining experience?*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hello *${order.customerName || 'Guest'}* 👋\n` +
      `Thank you for visiting *${restName}* today at Table ${order.tableNumber || '01'}!\n\n` +
      `We hope you loved your food & service. Would you mind sharing a quick 5-star review on Google?\n\n` +
      `👉 *Leave a Google Review:* ${reviewUrl}\n\n` +
      `Your 5-star rating helps our local kitchen team grow! Have a wonderful day ahead. ✨`
    );
  },

  /**
   * Quick dispatch trigger with dynamic restaurant settings fallback
   */
  sendNotification(mobile, type, order = {}, extra = {}, settings = {}) {
    let msg = '';
    if (type === 'ORDER_CONFIRMATION') msg = this.createOrderConfirmationMessage(order, settings);
    else if (type === 'KITCHEN_ETA') msg = this.createKitchenEtaMessage(order, extra.etaMinutes || 20, settings);
    else if (type === 'TABLE_BILL') msg = this.createTableBillMessage(order, settings);
    else if (type === 'GOOGLE_REVIEW') msg = this.createGoogleReviewMessage(order, settings);
    else msg = extra.customText || `${getRestaurantName(order, settings)} Alert: Order #${order.orderId || order.id} updated.`;

    return this.openWhatsAppChat(mobile || order.mobile, msg);
  },
};
