import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Platform SuperAdmin Authentication with brute-force rate limiter
// (progixtechnology@gmail.com / Progix@123 - Protected in DB)
router.post('/superadmin/login', authLimiter, authController.loginSuperAdmin);

// Restaurant Admin Authentication with brute-force rate limiter
// (resturant1@gmail.com / 123123)
router.post('/admin/login', authLimiter, authController.loginRestaurantAdmin);

// Verify Active Token & Check Validity
router.get('/verify', authenticateToken, authController.verifySession);

// Verify Admin Password for sensitive security actions (Protected by Brute-Force Rate Limiter)
router.post('/verify-password', authLimiter, authController.verifyAdminPassword);

export default router;


