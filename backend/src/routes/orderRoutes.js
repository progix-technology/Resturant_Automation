import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { orderCreationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Customer can place order and get status without requiring staff login
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderCreationLimiter, orderController.createOrder);

// Customer payment preference update (e.g. Pay at Counter)
router.patch('/:id/payment-preference', orderController.updatePaymentPreference);

// Admin / Staff status updates & payment confirmation (Protected)
router.patch('/:id/status', authenticateToken, orderController.updateOrderStatus);
router.patch('/:id/pay', authenticateToken, orderController.markPaymentPaid);

// Delete single order (Protected)
router.delete('/:id', authenticateToken, orderController.deleteOrder);

// Reset all orders and tables (Strictly Protected - Managers & Admins only)
router.delete('/', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_SUPERADMIN'), orderController.resetOrders);
router.post('/reset', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN', 'PLATFORM_SUPERADMIN'), orderController.resetOrders);

export default router;
