import express from 'express';
import { whatsappController } from '../controllers/whatsappController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/status', whatsappController.getStatus);
router.post('/send', whatsappController.sendMessage);
router.post('/pair-code', whatsappController.requestPairingCode);
router.post('/logout', whatsappController.logout);
router.post('/send-security-otp', authLimiter, whatsappController.sendSecurityOtp);
router.post('/verify-security-otp', authLimiter, whatsappController.verifySecurityOtp);

export default router;


