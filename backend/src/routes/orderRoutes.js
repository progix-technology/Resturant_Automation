import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Customer can place order and get status without requiring staff login
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);

// Admin status updates
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/pay', orderController.markPaymentPaid);

// Reset all orders and tables (Clean slate)
router.delete('/', orderController.resetOrders);
router.post('/reset', orderController.resetOrders);

export default router;
