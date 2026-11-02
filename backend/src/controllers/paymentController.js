import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { Order } from '../models/Order.js';
import { Table } from '../models/Table.js';
import { whatsappService } from '../services/whatsappService.js';
import { orderLifecycleNotificationService } from '../services/orderLifecycleNotificationService.js';

/**
 * Helper to fetch Razorpay credentials for a specific restaurant
 */
async function getRazorpayCredentials(restaurantSlug) {
  const cleanSlug = (restaurantSlug || 'spice-garden').toLowerCase().trim().replace(/_/g, '-');
  const settings = await RestaurantSettings.findOne({
    $or: [{ slug: cleanSlug }, { slug: `the-${cleanSlug}` }],
  }).lean();

  let keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '';
  let keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '';
  const isEnabled = settings?.isRazorpayEnabled ?? Boolean(keyId && keySecret);

  return {
    keyId: keyId.trim(),
    keySecret: keySecret.trim(),
    isEnabled,
    settings,
    cleanSlug,
  };
}

export const paymentController = {
  /**
   * Get public payment configuration for customer checkout
   */
  async getConfig(req, res) {
    try {
      const { slug } = req.params;
      const { keyId, isEnabled, settings } = await getRazorpayCredentials(slug);

      return res.status(200).json({
        success: true,
        keyId: isEnabled ? keyId : '',
        isRazorpayEnabled: isEnabled && Boolean(keyId),
        restaurantName: settings?.restaurantName || settings?.name || 'Restaurant',
        currency: 'INR',
        upiId: settings?.upiId || '',
      });
    } catch (err) {
      console.error('getPaymentConfig error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch payment config' });
    }
  },

  /**
   * Create Razorpay Order with strict server-side database price enforcement
   */
  async createOrder(req, res) {
    try {
      const { orderId, restaurantSlug, customerName, customerMobile } = req.body;

      if (!orderId) {
        return res.status(400).json({ success: false, message: 'orderId is required' });
      }

      // 1. Fetch genuine order record from MongoDB Atlas
      const cleanId = String(orderId).replace(/^#/, '').trim();
      const existingOrder = await Order.findOne({
        $or: [
          { orderId: cleanId },
          { orderId: `#${cleanId}` },
          { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null },
        ],
      });

      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: `Order #${cleanId} not found in database.`,
        });
      }

      if (existingOrder.paymentStatus === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: `Order #${existingOrder.orderId} is already paid.`,
        });
      }

      // 2. CRITICAL SECURITY: Enforce amount strictly from MongoDB Atlas Order document
      // Client-provided 'amount' is deliberately ignored to prevent price tampering fraud.
      const realOrderAmount = Number(existingOrder.total);
      if (!realOrderAmount || realOrderAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Order total in database is invalid or zero.',
        });
      }

      const effectiveSlug = existingOrder.restaurantSlug || restaurantSlug;
      const { keyId, keySecret, isEnabled, cleanSlug, settings } = await getRazorpayCredentials(effectiveSlug);

      if (!isEnabled || !keyId || !keySecret) {
        return res.status(400).json({
          success: false,
          isNotConfigured: true,
          message: 'Razorpay is not yet configured for this restaurant. Please configure Razorpay Key ID and Secret in Admin Settings.',
        });
      }

      const rzp = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const amountInPaise = Math.round(realOrderAmount * 100);

      const rzOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: String(existingOrder.orderId).slice(-40),
        notes: {
          orderId: String(existingOrder.orderId),
          restaurantSlug: cleanSlug,
          customerName: customerName || existingOrder.customerName || 'Guest',
          customerMobile: customerMobile || existingOrder.mobile || '',
        },
      });

      // Update Order with genuine razorpayOrderId
      existingOrder.razorpayOrderId = rzOrder.id;
      await existingOrder.save();

      return res.status(200).json({
        success: true,
        razorpayOrderId: rzOrder.id,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
        keyId,
        restaurantName: settings?.restaurantName || settings?.name || 'Restaurant',
      });
    } catch (err) {
      console.error('createRazorpayOrder error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to initialize Razorpay order',
      });
    }
  },

  /**
   * Cryptographically verify Razorpay signature and mark order paid
   */
  async verifyPayment(req, res) {
    try {
      const {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        restaurantSlug,
      } = req.body;

      if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required Razorpay verification payload',
        });
      }

      // Fetch authentic order from MongoDB Atlas
      const cleanId = String(orderId).replace(/^#/, '').trim();
      const existingOrder = await Order.findOne({
        $or: [
          { orderId: cleanId },
          { orderId: `#${cleanId}` },
          { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null },
        ],
      });

      if (!existingOrder) {
        return res.status(404).json({ success: false, message: 'Order record not found' });
      }

      // Security check: Verify that razorpay_order_id matches the one created for this order
      if (existingOrder.razorpayOrderId && existingOrder.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({
          success: false,
          message: 'Security Alert: Razorpay Order ID mismatch for this order!',
        });
      }

      const effectiveSlug = existingOrder.restaurantSlug || restaurantSlug;
      const { keySecret, cleanSlug, settings } = await getRazorpayCredentials(effectiveSlug);

      if (!keySecret) {
        return res.status(500).json({
          success: false,
          message: 'Razorpay key secret not found for verification',
        });
      }

      // 1. Cryptographic HMAC SHA256 Signature Verification (Timing-safe)
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      const isSignatureValid =
        typeof razorpay_signature === 'string' &&
        generatedSignature.length === razorpay_signature.length &&
        crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpay_signature));

      if (!isSignatureValid) {
        console.error('[RAZORPAY] Signature verification failed:', {
          received: razorpay_signature,
          generated: generatedSignature,
        });
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature! Transaction verification failed.',
        });
      }

      // 2. Mark Order as COMPLETED in MongoDB Atlas
      existingOrder.paymentStatus = 'COMPLETED';
      existingOrder.orderStatus = 'CONFIRMED';
      existingOrder.paymentMethod = 'RAZORPAY_UPI';
      existingOrder.razorpayOrderId = razorpay_order_id;
      existingOrder.razorpayPaymentId = razorpay_payment_id;
      existingOrder.razorpaySignature = razorpay_signature;
      existingOrder.paidAt = new Date();
      const updatedOrder = (await existingOrder.save()).toObject();

      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: 'Order record not found' });
      }

      // 3. Atomically occupy and update table status in MongoDB Atlas
      await Table.findOneAndUpdate(
        { restaurantSlug: cleanSlug, number: updatedOrder.tableNumber },
        {
          $set: {
            status: 'OCCUPIED',
            customerName: updatedOrder.customerName,
            currentOrderId: updatedOrder.orderId,
            amount: updatedOrder.total,
            occupiedSince: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      // 4. STEP 3 & 5 AUTOMATION: Payment confirmed alert to customer & admin (auto-triggers review if served)
      orderLifecycleNotificationService.sendPaymentConfirmedAlert(updatedOrder, razorpay_payment_id).catch(() => {});

      return res.status(200).json({
        success: true,
        message: 'Payment verified and confirmed successfully!',
        data: {
          ...updatedOrder,
          id: updatedOrder.orderId,
        },
      });
    } catch (err) {
      console.error('verifyPayment error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during verification' });
    }
  },

  /**
   * Razorpay Webhook Handler (Asynchronous Payment Safety Net)
   * Captures real-time 'payment.captured' & 'order.paid' events directly from Razorpay servers.
   * Guarantees 100% order confirmation even if customer closes browser or loses connection.
   */
  async handleWebhook(req, res) {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'];
      const event = req.body?.event;
      const paymentPayload = req.body?.payload?.payment?.entity;
      const orderPayload = req.body?.payload?.order?.entity;

      // Extract metadata notes from payload
      const notes = paymentPayload?.notes || orderPayload?.notes || {};
      const orderId = notes.orderId;
      const restaurantSlug = notes.restaurantSlug;

      // 1. Multi-Tenant Webhook Secret Resolution
      let webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      let restaurantSettings = null;

      if (restaurantSlug) {
        restaurantSettings = await RestaurantSettings.findOne({
          $or: [{ slug: restaurantSlug }, { slug: `the-${restaurantSlug}` }],
        }).lean();

        if (restaurantSettings?.razorpayWebhookSecret) {
          webhookSecret = restaurantSettings.razorpayWebhookSecret.trim();
        }
      }

      // 2. Cryptographic Raw-Body HMAC SHA256 Signature Verification
      if (webhookSecret) {
        if (!webhookSignature) {
          console.warn('[RAZORPAY WEBHOOK] Rejected: Missing x-razorpay-signature header');
          return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
        }

        const rawData = req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body));
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawData)
          .digest('hex');

        const isWebhookValid =
          typeof webhookSignature === 'string' &&
          expectedSignature.length === webhookSignature.length &&
          crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(webhookSignature));

        if (!isWebhookValid) {
          console.error('[RAZORPAY WEBHOOK] Cryptographic signature mismatch! Potential spoofing attempt.');
          return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }
      } else {
        console.warn('[RAZORPAY WEBHOOK] Notice: RAZORPAY_WEBHOOK_SECRET not configured. Skipping signature verification.');
      }

      // 3. Handle 'payment.captured' or 'order.paid' events
      if (event === 'payment.captured' || event === 'order.paid') {
        const rzPaymentId = paymentPayload?.id;
        const rzOrderId = paymentPayload?.order_id || orderPayload?.id;
        const amountCaptured = (paymentPayload?.amount || orderPayload?.amount || 0) / 100;

        // Locate order by multiple identifiers (notes.orderId, receipt, or razorpayOrderId)
        const cleanId = String(orderId || paymentPayload?.receipt || '').replace(/^#/, '').trim();
        let existingOrder = null;

        if (cleanId) {
          existingOrder = await Order.findOne({
            $or: [
              { orderId: cleanId },
              { orderId: `#${cleanId}` },
              { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null },
            ],
          });
        }

        if (!existingOrder && rzOrderId) {
          existingOrder = await Order.findOne({ razorpayOrderId: rzOrderId });
        }

        if (!existingOrder) {
          console.warn(`[RAZORPAY WEBHOOK] Order not found for Order ID: "${cleanId}" / Razorpay Order: "${rzOrderId}".`);
          return res.status(200).json({ status: 'ok', message: 'Order not found, ignored.' });
        }

        // Idempotency: If already completed, acknowledge Razorpay without duplicate processing
        if (existingOrder.paymentStatus === 'COMPLETED') {
          console.log(`[RAZORPAY WEBHOOK] Order #${existingOrder.orderId} already marked COMPLETED. Skipping duplicate.`);
          return res.status(200).json({ status: 'ok', message: 'Order already processed.' });
        }

        // Update Order atomically
        existingOrder.paymentStatus = 'COMPLETED';
        if (existingOrder.orderStatus === 'PENDING' || !existingOrder.orderStatus) {
          existingOrder.orderStatus = 'CONFIRMED';
        }
        existingOrder.paymentMethod = 'RAZORPAY_UPI';
        if (rzPaymentId) existingOrder.razorpayPaymentId = rzPaymentId;
        if (rzOrderId) existingOrder.razorpayOrderId = rzOrderId;
        existingOrder.paidAt = new Date();
        const updatedOrder = await existingOrder.save();

        console.log(`[RAZORPAY WEBHOOK SUCCESS] Order #${updatedOrder.orderId} confirmed via Webhook. Amount: ₹${amountCaptured}`);

        // Update Table state in Atlas
        const effectiveSlug = existingOrder.restaurantSlug || restaurantSlug || 'spice-garden';
        await Table.findOneAndUpdate(
          { restaurantSlug: effectiveSlug, number: updatedOrder.tableNumber },
          {
            $set: {
              status: 'OCCUPIED',
              customerName: updatedOrder.customerName,
              currentOrderId: updatedOrder.orderId,
              amount: updatedOrder.total,
              occupiedSince: new Date().toISOString(),
            },
          },
          { upsert: true }
        );

        // STEP 3 & 5 AUTOMATION: Payment confirmed alert to customer & admin (auto-triggers review if served)
        orderLifecycleNotificationService.sendPaymentConfirmedAlert(updatedOrder, rzPaymentId || 'Razorpay Webhook').catch(() => {});

        return res.status(200).json({
          status: 'ok',
          processed: true,
          orderId: updatedOrder.orderId,
          paymentId: rzPaymentId,
        });
      }

      // Other events acknowledged
      return res.status(200).json({ status: 'ok', message: `Event ${event} acknowledged` });
    } catch (err) {
      console.error('[RAZORPAY WEBHOOK ERROR]:', err);
      return res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

