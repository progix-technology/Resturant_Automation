import { whatsappService } from './whatsappService.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import QRCode from 'qrcode';

export const orderLifecycleNotificationService = {
  /**
   * STEP 1: Customer Places Order (Automatic)
   * Dispatches WhatsApp to Customer:
   * "Thank you [Name]! Your order #[orderId] for Table [Table] is received! Items: ... Total: ₹... Just wait a minute, our staff will confirm your preparation time shortly!"
   */
  async sendOrderReceivedAlert(order) {
    if (!order || !order.mobile) return;
    try {
      const cleanSlug = (order.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const settings = await RestaurantSettings.findOne({
        $or: [{ slug: cleanSlug }, { slug: `the-${cleanSlug}` }],
      }).lean();

      const restName = settings?.restaurantName || settings?.name || 'Spice Garden';
      const itemsList = (order.items || [])
        .map((i) => `• ${i.quantity || 1}x ${i.name} (₹${(i.price || 0) * (i.quantity || 1)})`)
        .join('\n');

      const messageText =
        `🍽️ *${restName.toUpperCase()} - ORDER RECEIVED!* 📋\n\n` +
        `Hello *${order.customerName || 'Valued Guest'}* 👋\n` +
        `Thank you for ordering with us at *Table ${order.tableNumber || '01'}*!\n\n` +
        `*Your Order Items:*\n${itemsList || '• Delicious items from our menu'}\n\n` +
        `💰 *Total Amount:* *₹${order.total}*\n` +
        `⏳ *Status:* Received\n\n` +
        `_Just wait a minute, our kitchen staff is reviewing and will confirm your preparation time shortly!_ 🙏`;

      await whatsappService.sendMessage({
        slug: cleanSlug,
        mobile: order.mobile,
        messageText,
      });

      // Also alert the Admin phone
      const adminPhone = settings?.phone || settings?.whatsappPhone;
      if (adminPhone) {
        const adminAlert =
          `🔔 *NEW TABLE ORDER RECEIVED!* 🛎️\n\n` +
          `*Order:* #${order.orderId}\n` +
          `*Table:* Table ${order.tableNumber}\n` +
          `*Customer:* ${order.customerName || 'Guest'} (+${order.mobile})\n` +
          `*Total:* ₹${order.total}\n\n` +
          `👉 Please open Admin Orders to confirm prep time & dispatch payment link!`;
        whatsappService.sendMessage({ slug: cleanSlug, mobile: adminPhone, messageText: adminAlert }).catch(() => {});
      }
    } catch (err) {
      console.warn('[ORDER RECEIVED NOTIF WARNING]:', err.message);
    }
  },

  /**
   * STEP 2: Admin Confirms Order & Sets Preparation Time (Admin Triggered)
   * Dispatches WhatsApp to Customer:
   * "Thank you for ordering. Your order is confirmed and will take approximately [ETA] Minutes to prepare! Total: ₹... Payment link: [link]"
   */
  async sendOrderConfirmedEtaAlert(order, etaMinutes = 20, frontendOrigin = '') {
    if (!order || !order.mobile) return;
    try {
      const cleanSlug = (order.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const settings = await RestaurantSettings.findOne({
        $or: [{ slug: cleanSlug }, { slug: `the-${cleanSlug}` }],
      }).lean();

      const restName = settings?.restaurantName || settings?.name || 'Spice Garden';
      const restUpi = settings?.upiId || 'spicegarden@okhdfcbank';
      const eta = Number(etaMinutes || order.etaMinutes || 20);

      const origin = frontendOrigin || process.env.FRONTEND_URL || 'http://localhost:5173';
      const paymentLink = `${origin}/menu/${cleanSlug}/order-status?orderId=${order.orderId}`;

      // Generate dynamic UPI QR buffer
      let imageBuffer = null;
      try {
        const upiUri = `upi://pay?pa=${restUpi.trim()}&pn=${encodeURIComponent(restName)}&am=${order.total}&cu=INR&tn=${encodeURIComponent(`Bill_${order.orderId}`)}`;
        imageBuffer = await QRCode.toBuffer(upiUri, { errorCorrectionLevel: 'H', margin: 2, width: 450 });
      } catch (e) {}

      const messageText =
        `👨‍🍳 *${restName.toUpperCase()} - ORDER CONFIRMED!* ⏱️\n\n` +
        `Hello *${order.customerName || 'Valued Guest'}*!\n` +
        `Thank you for ordering! Your order has been confirmed by our kitchen and will take approximately *${eta} Minutes* to prepare. 👨‍🍳🔥\n\n` +
        `📌 *Order Reference:* \`#${order.orderId}\` (Table ${order.tableNumber})\n` +
        `💰 *Total Amount:* *₹${order.total}*\n\n` +
        `💳 *Pay Your Bill Online (UPI / GPay / PhonePe / Cards):*\n` +
        `👉 ${paymentLink}\n\n` +
        `_Or you can also scan the QR attached above, or pay cash at the counter/table._ 🙏`;

      return await whatsappService.sendMessage({
        slug: cleanSlug,
        mobile: order.mobile,
        messageText,
        imageBuffer,
      });
    } catch (err) {
      console.warn('[ORDER CONFIRMED NOTIF WARNING]:', err.message);
    }
  },

  /**
   * STEP 3: Payment Confirmed (Online or Cash at Counter)
   * Dispatches WhatsApp to Customer & Admin.
   * If the order is ALREADY SERVED, automatically triggers STEP 5 (Thank you & Google review)!
   */
  async sendPaymentConfirmedAlert(order, paymentId = 'Cash/Counter') {
    if (!order) return;
    try {
      const cleanSlug = (order.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const settings = await RestaurantSettings.findOne({
        $or: [{ slug: cleanSlug }, { slug: `the-${cleanSlug}` }],
      }).lean();

      const restName = settings?.restaurantName || settings?.name || 'Spice Garden';

      // 1. Message to Customer
      if (order.mobile) {
        const customerMsg =
          `✅ *PAYMENT CONFIRMED!* 💳\n\n` +
          `Dear *${order.customerName || 'Valued Guest'}*,\n` +
          `Your payment of *₹${order.total}* for Order \`#${order.orderId}\` (Table ${order.tableNumber}) has been successfully received!\n\n` +
          `Food preparation and dining are in progress. Enjoy your meal at *${restName}*! 😋✨`;

        whatsappService.sendMessage({
          slug: cleanSlug,
          mobile: order.mobile,
          messageText: customerMsg,
        }).catch(() => {});
      }

      // 2. Alert to Admin
      const adminPhone = settings?.phone || settings?.whatsappPhone;
      if (adminPhone) {
        const adminAlert =
          `🎉 *PAYMENT RECEIVED!* 💳\n\n` +
          `*Order:* #${order.orderId} (Table ${order.tableNumber})\n` +
          `*Amount:* ₹${order.total}\n` +
          `*Payment ID:* ${paymentId}\n` +
          `*Customer:* ${order.customerName || 'Guest'}\n\n` +
          `Payment is cleared! ✅`;
        whatsappService.sendMessage({ slug: cleanSlug, mobile: adminPhone, messageText: adminAlert }).catch(() => {});
      }

      // Check if order is already SERVED: if so, both Served & Paid are done -> trigger Step 5!
      if (order.orderStatus === 'SERVED' || order.orderStatus === 'COMPLETED') {
        setTimeout(() => {
          this.sendThankYouAndReviewAlert(order);
        }, 1500);
      }
    } catch (err) {
      console.warn('[PAYMENT CONFIRMED NOTIF WARNING]:', err.message);
    }
  },

  /**
   * STEP 4: Order Marked as SERVED
   * - If NOT paid yet: Sends "Your order is served! Please pay your bill: [link]"
   * - If ALREADY paid: Automatically triggers STEP 5 (Thank You & Google Rating)!
   */
  async sendOrderServedAlert(order, frontendOrigin = '') {
    if (!order) return;
    try {
      const cleanSlug = (order.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const settings = await RestaurantSettings.findOne({
        $or: [{ slug: cleanSlug }, { slug: `the-${cleanSlug}` }],
      }).lean();

      const restName = settings?.restaurantName || settings?.name || 'Spice Garden';
      const isPaid = order.paymentStatus === 'COMPLETED';

      if (!isPaid && order.mobile) {
        // Case A: Customer hasn't paid yet -> send served alert + bill payment reminder
        const origin = frontendOrigin || process.env.FRONTEND_URL || 'http://localhost:5173';
        const paymentLink = `${origin}/menu/${cleanSlug}/order-status?orderId=${order.orderId}`;

        const servedPendingBillMsg =
          `🍽️ *${restName.toUpperCase()} - YOUR ORDER HAS BEEN SERVED!* 😋\n\n` +
          `Dear *${order.customerName || 'Valued Guest'}*,\n` +
          `Your freshly prepared order \`#${order.orderId}\` for *Table ${order.tableNumber}* has been served to your table. Please enjoy your meal!\n\n` +
          `⚠️ *Bill Payment Pending:* *₹${order.total}*\n` +
          `You can pay conveniently online right from your seat:\n` +
          `👉 ${paymentLink}\n\n` +
          `_Or pay cash / UPI at the counter when you are done. Thank you!_ 🙏`;

        await whatsappService.sendMessage({
          slug: cleanSlug,
          mobile: order.mobile,
          messageText: servedPendingBillMsg,
        });
      } else if (isPaid) {
        // Case B: Already paid -> both Served & Paid are now done! Trigger Step 5!
        setTimeout(() => {
          this.sendThankYouAndReviewAlert(order);
        }, 1500);
      }
    } catch (err) {
      console.warn('[ORDER SERVED NOTIF WARNING]:', err.message);
    }
  },

  /**
   * STEP 5: Thank You & Google Review (Automatic when BOTH Served & Paid are done)
   */
  async sendThankYouAndReviewAlert(order) {
    if (!order || !order.mobile || order.thankYouSent) return;
    try {
      const cleanSlug = (order.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const settings = await RestaurantSettings.findOne({
        $or: [{ slug: cleanSlug }, { slug: `the-${cleanSlug}` }],
      }).lean();

      const restName = settings?.restaurantName || settings?.name || 'Spice Garden';
      const reviewUrl = settings?.googleReviewUrl || 'https://search.google.com/local/writereview';

      const reviewMsg =
        `🌟 *THANK YOU FOR DINING AT ${restName.toUpperCase()}!* ⭐⭐⭐⭐⭐\n\n` +
        `Dear *${order.customerName || 'Valued Guest'}*,\n` +
        `We hope you had a delightful dining experience with us today at Table ${order.tableNumber}! 🙏✨\n\n` +
        `If you enjoyed our food and service, could you take 30 seconds to rate us *5 Stars* on Google? It means the world to our kitchen team!\n\n` +
        `👉 *Share Your 5-Star Review:*\n${reviewUrl}\n\n` +
        `We look forward to welcoming you back again soon! Have a fantastic day! 💖🍽️`;

      await whatsappService.sendMessage({
        slug: cleanSlug,
        mobile: order.mobile,
        messageText: reviewMsg,
      });

      // Mark order.thankYouSent = true to prevent duplicate review messages
      const { Order } = await import('../models/Order.js');
      await Order.updateOne({ _id: order._id }, { $set: { thankYouSent: true } });
      console.log(`[THANK YOU & REVIEW DELIVERED] Dispatched to +${order.mobile} for Order #${order.orderId}`);
    } catch (err) {
      console.warn('[THANK YOU REVIEW NOTIF WARNING]:', err.message);
    }
  },
};

