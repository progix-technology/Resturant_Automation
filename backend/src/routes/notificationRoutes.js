import { Router } from 'express';
import { whatsappService } from '../services/whatsappService.js';

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

    const restName = restaurantName || 'Restaurant';
    const restUpi = upiVpa || 'merchant@upi';
    const slug = restaurantSlug || 'menu';

    let text = customMessage || '';
    if (!text) {
      if (type === 'ORDER_CONFIRMATION') {
        text = `*${restName} - Order Received!* 🍽️\n\nHello *${customerName || 'Guest'}*,\nYour order #${orderId} for Table ${tableNumber || '01'} of total ₹${total || 0} is confirmed by kitchen!`;
      } else if (type === 'TABLE_BILL') {
        text = `*${restName} - Your Food is Ready! Please Pay Bill to Receive Service* 🍽️⚡\n\nHello *${customerName || 'Guest'}*,\nYour meal for Table ${tableNumber || '01'} (Order #${orderId}) is hot & ready!\nTotal Bill: *₹${total || 0}*\nPay via UPI: https://upiqr.in/api/qr?name=${encodeURIComponent(restName)}&vpa=${restUpi}&amount=${total || 0}\n\nServer will deliver your meal once payment is confirmed! ✨`;
      } else if (type === 'GOOGLE_REVIEW') {
        text = `*How was your dining experience at ${restName}?* ⭐⭐⭐⭐⭐\n\nDear *${customerName || 'Guest'}*,\nPlease share your review & 5-star rating on Google:\n👉 ${googleReviewUrl || 'https://search.google.com'}`;
      } else {
        text = `*${restName} Alert:* Order #${orderId} at Table ${tableNumber || '01'} has been updated! Total: ₹${total || 0}.`;
      }
    }

    // Call whatsappService to send via Meta Cloud API or fallback smart link
    const result = await whatsappService.sendMessage({
      mobile,
      messageText: text,
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
