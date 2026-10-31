import express from 'express';
import { whatsappController } from '../controllers/whatsappController.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', whatsappController.getStatus);
router.post('/send', authenticateToken, whatsappController.sendMessage);
router.post('/pair-code', authenticateToken, whatsappController.requestPairingCode);
router.post('/logout', authenticateToken, whatsappController.logout);
router.post('/send-security-otp', otpLimiter, whatsappController.sendSecurityOtp);
router.post('/verify-security-otp', otpLimiter, whatsappController.verifySecurityOtp);

export default router;


