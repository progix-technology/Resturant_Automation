import { Router } from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { orderCreationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public payment config for a restaurant
router.get('/config/:slug', paymentController.getConfig);

// Create Razorpay Order (Protected against bot flooding)
router.post('/create-order', orderCreationLimiter, paymentController.createOrder);

// Verify Razorpay payment signature & update order in Atlas
router.post('/verify', paymentController.verifyPayment);

// Razorpay asynchronous Webhook
router.post('/webhook', paymentController.handleWebhook);

export default router;

