import express from 'express';
import { whatsappController } from '../controllers/whatsappController.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken, permissiveAuthenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Status check (Permissive so tenant UI can check live socket status)
router.get('/status', permissiveAuthenticateToken, whatsappController.getStatus);

// Internal background message sender
router.post('/send', permissiveAuthenticateToken, whatsappController.sendMessage);

// 🛡️ Multi-Tenant Protected Routes: Strictly locked to authenticated restaurant admin & superadmin
router.post('/pair-code', authenticateToken, authLimiter, whatsappController.requestPairingCode);
router.post('/logout', authenticateToken, whatsappController.logout);
router.post('/send-security-otp', authenticateToken, otpLimiter, whatsappController.sendSecurityOtp);
router.post('/verify-security-otp', authenticateToken, otpLimiter, whatsappController.verifySecurityOtp);

export default router;


