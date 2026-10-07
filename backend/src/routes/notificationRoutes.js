import { Router } from 'express';
import QRCode from 'qrcode';
import { whatsappService } from '../services/whatsappService.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';

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
