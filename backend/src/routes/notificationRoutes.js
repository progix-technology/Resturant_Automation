import { Router } from 'express';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { whatsappService } from '../services/whatsappService.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { WaiterCall } from '../models/WaiterCall.js';
import { Order } from '../models/Order.js';
import { orderLifecycleNotificationService } from '../services/orderLifecycleNotificationService.js';

const router = Router();

// Multi-Tenant Meta WhatsApp Engine Status Check
router.get('/whatsapp/status', (req, res) => {
  const metaConfigured = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

  res.status(200).json({
    success: true,
    engine: metaConfigured ? 'Official Meta WhatsApp Business Cloud API' : 'Dynamic WhatsApp Smart Link & Multi-Tenant Dispatcher',
    status: 'ACTIVE',
    mode: metaConfigured ? 'REAL_TIME_META_CLOUD_DISPATCH' : 'ZERO_COST_SMART_LINK',
    metaConfigured,
    monthlyLimit: metaConfigured ? '1,000 Free Meta Conversations / Month' : 'UNLIMITED (100% Free)',
    activeCountry: '+91 (India)',
  });
});

// Post Waiter Call / Assistance Request from Customer
router.post('/waiter-call', async (req, res) => {
  try {
    const { tableNumber, customerName, restaurantSlug, notes } = req.body;
    const cleanSlug = (restaurantSlug || 'spice-garden').toLowerCase().trim().replace(/_/g, '-');
    const tableNum = String(tableNumber || '01').replace(/^Table\s*/i, '').trim();
    const callId = `wcall-${Date.now()}`;

    const created = await WaiterCall.create({
      callId,
      id: callId,
      tableNumber: tableNum,
      customerName: customerName ? String(customerName).trim() : 'Guest Diner',
      restaurantSlug: cleanSlug,
      reason: notes || 'Assistance requested at table',
      status: 'PENDING',
    });

    // Send WhatsApp alert to restaurant admin if connected
    try {
      const dbSettings = await RestaurantSettings.findOne({ slug: cleanSlug });
      const alertMsg = `🚨 *WAITER ASSISTANCE NEEDED!* 🛎️\n\nCustomer *${created.customerName}* at *Table ${created.tableNumber}* has requested waiter help at table. Please attend immediately!`;
      const adminPhone = dbSettings?.phone || dbSettings?.whatsappPhone || '9876543210';

      whatsappService.sendMessage({
        slug: cleanSlug,
        mobile: adminPhone,
        messageText: alertMsg,
      }).catch(() => {});
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Waiter notified for Table ${tableNum}`,
      data: created,
    });
  } catch (err) {
    console.error('Waiter call error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispatch waiter request' });
  }
});

// Get Active Pending Waiter Calls
router.get('/waiter-calls', async (req, res) => {
  try {
    const { slug } = req.query;
    const cleanSlug = (slug || 'spice-garden').toLowerCase().trim().replace(/_/g, '-');

    const pending = await WaiterCall.find({
      restaurantSlug: cleanSlug,
      status: 'PENDING',
    }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: pending.length,
      data: pending.map((c) => ({ ...c, id: c.callId || c.id })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch waiter calls' });
  }
});

// Resolve / Mark Assisted Waiter Call
router.patch('/waiter-calls/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber } = req.body;
    const cleanId = String(id).trim();
    const cleanTable = tableNumber ? String(tableNumber).replace(/^Table\s*/i, '').trim() : '';

    await WaiterCall.updateMany(
      {
        $or: [
          { callId: cleanId },
          { id: cleanId },
          ...(cleanTable ? [{ tableNumber: cleanTable, status: 'PENDING' }] : []),
        ],
      },
      {
        $set: { status: 'RESOLVED' },
      }
    );

    return res.status(200).json({
      success: true,
      message: `Waiter request resolved`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to resolve waiter call' });
  }
});

// STEP 2: Admin Confirms Order with Preparation Time (Dispatches ETA & Payment Link to Customer)
router.post('/order-confirmed-eta', async (req, res) => {
  try {
    const { orderId, etaMinutes, mobile } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const cleanId = String(orderId).replace(/^#/, '').trim();
    const order = await Order.findOne({
      $or: [{ orderId: cleanId }, { orderId: `#${cleanId}` }, { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null }],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const eta = Number(etaMinutes || order.etaMinutes || 20);
    order.etaMinutes = eta;
    if (order.orderStatus === 'RECEIVED' || order.orderStatus === 'PENDING') {
      order.orderStatus = 'CONFIRMED';
    }
    if (mobile && (!order.mobile || order.mobile !== mobile)) {
      order.mobile = mobile;
    }
    await order.save();

    const dispatchResult = await orderLifecycleNotificationService.sendOrderConfirmedEtaAlert(
      order,
      eta,
      req.headers.origin
    );

    return res.status(200).json({
      success: true,
      message: `Order #${order.orderId} confirmed with ${eta}m prep time. Customer notified via WhatsApp!`,
      data: order,
      dispatch: dispatchResult,
    });
  } catch (err) {
    console.error('order-confirmed-eta error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to dispatch ETA alert' });
  }
});

// Dispatch Real-Time WhatsApp Notification (Meta Cloud API / Smart Dispatch)
router.post('/whatsapp/send', async (req, res) => {
  try {
    const {
      mobile,
      customerName,
      orderId,
      tableNumber,
      total,
      type,
      items,
      customMessage,
      restaurantName,
      upiVpa,
      restaurantSlug,
      googleReviewUrl,
      templateName,
      components,
      credentials,
    } = req.body;

    if (!mobile && !customMessage) {
      return res.status(400).json({
        success: false,
        message: 'Recipient mobile number or message is required',
      });
    }

    const cleanSlug = (restaurantSlug || 'spice-garden').toLowerCase().trim().replace(/_/g, '-');
    
    // Fetch live settings if available to get upiId
    let dbSettings = null;
    try {
      dbSettings = await RestaurantSettings.findOne({ slug: cleanSlug });
    } catch (e) {}

    const restName = restaurantName || dbSettings?.restaurantName || dbSettings?.name || 'Restaurant';
    const restUpi = (upiVpa && upiVpa !== 'spicegarden@upi') ? upiVpa : (dbSettings?.upiId || dbSettings?.upiVpa || upiVpa || 'spicegarden@okhdfcbank');
    const amount = Number(total || 0);

    let text = customMessage || '';
    let imageBuffer = null;

    if (!text) {
      if (type === 'ORDER_CONFIRMATION') {
        text = `*${restName} - Order Received!* 🍽️\n\nHello *${customerName || 'Guest'}*,\nYour order #${orderId} for Table ${tableNumber || '01'} of total ₹${amount} is confirmed by kitchen!`;
      } else if (type === 'TABLE_BILL') {
        // Generate dynamic UPI QR image buffer with exact auto-fixed order amount
        const upiUri = `upi://pay?pa=${restUpi.trim()}&pn=${encodeURIComponent(restName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Bill_${orderId || '001'}`)}`;
        try {
          imageBuffer = await QRCode.toBuffer(upiUri, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 450,
          });
        } catch (qrErr) {
          console.warn('[QR GENERATION ERROR]:', qrErr.message);
        }

        text = `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🧾  *${restName.toUpperCase()}*  🧾\n` +
          `*Digital Table Invoice & Bill*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Hello *${customerName || 'Guest'}* 👋\n` +
          `Your meal for *Table ${tableNumber || '01'}* (Order \`#${orderId || '001'}\`) is hot & ready!\n\n` +
          `──────────────────────────\n` +
          `💳 *GRAND TOTAL PAYABLE:* *₹${amount}*\n` +
          `📌 *PAYMENT STATUS:* ⏳ *PENDING*\n` +
          `──────────────────────────\n\n` +
          `📲 *PAYMENT QR CODE ATTACHED ABOVE*\n` +
          `*Scan the attached QR code using Google Pay, PhonePe, Paytm or BHIM UPI to complete payment of exact ₹${amount}.* (Amount is pre-filled!)\n\n` +
          `👉 *UPI VPA:* \`${restUpi}\` ✨`;
      } else if (type === 'GOOGLE_REVIEW') {
        text = `*How was your dining experience at ${restName}?* ⭐⭐⭐⭐⭐\n\nDear *${customerName || 'Guest'}*,\nPlease share your review & 5-star rating on Google:\n👉 ${googleReviewUrl || 'https://search.google.com'}`;
      } else {
        text = `*${restName} Alert:* Order #${orderId} at Table ${tableNumber || '01'} has been updated! Total: ₹${amount}.`;
      }
    }

    // Call whatsappService to send via Meta Cloud API or background socket with image attachment
    const result = await whatsappService.sendMessage({
      slug: cleanSlug,
      mobile,
      messageText: text,
      imageBuffer,
      templateName,
      components,
      credentials,
    });

    return res.status(200).json({
      success: true,
      message: result.provider === 'META_CLOUD_API'
        ? 'Real-time WhatsApp message dispatched directly to phone via Meta Cloud API!'
        : 'WhatsApp notification prepared successfully',
      restaurantName: restName,
      ...result,
    });
  } catch (err) {
    console.error('WhatsApp notification dispatch error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to process WhatsApp notification request',
    });
  }
});

export default router;
