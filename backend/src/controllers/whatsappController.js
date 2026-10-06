import { whatsappService } from '../services/whatsappService.js';

const securityOtps = new Map();

export const whatsappController = {

  /**
   * GET /api/whatsapp/status?slug=...
   * Returns current QR code base64 and connection state for tenant
   */
  async getStatus(req, res) {
    try {
      const slug = req.query.slug || req.body.slug || 'spice-garden';
      const status = await whatsappService.getStatus(slug);
      return res.json({
        success: true,
        ...status,
      });
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/whatsapp/send
   * Dispatches automated background message for tenant
   */
  async sendMessage(req, res) {
    try {
      const { slug = 'spice-garden', mobile, messageText } = req.body;

      if (!mobile || !messageText) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number and messageText are required',
        });
      }

      const result = await whatsappService.sendMessage({ slug, mobile, messageText });
      return res.json(result);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to dispatch WhatsApp message',
      });
    }
  },

  /**
   * POST /api/whatsapp/pair-code
   * Requests 8-digit pairing code for a given tenant mobile number
   */
  async requestPairingCode(req, res) {
    try {
      const { slug = 'spice-garden', mobile } = req.body;
      if (!mobile) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number is required to request pairing code',
        });
      }

      const result = await whatsappService.requestPairingCode({ slug, mobile });
      return res.json(result);
    } catch (error) {
      console.error('Error requesting WhatsApp pairing code:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to request pairing code',
      });
    }
  },

  /**
   * POST /api/whatsapp/logout
   * Clears saved tenant session and resets QR code
   */
  async logout(req, res) {
    try {
      const { slug = 'spice-garden' } = req.body;
      const result = await whatsappService.logout(slug);
      return res.json(result);
    } catch (error) {
      console.error('Error logging out WhatsApp:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/whatsapp/send-security-otp
   * Generates a 6-digit OTP and sends via WhatsApp to the target mobile number.
   */
  async sendSecurityOtp(req, res) {
    try {
      const { slug = 'spice-garden', mobile } = req.body;
      if (!mobile) {
        return res.status(400).json({ success: false, message: 'Mobile number is required to receive Security OTP' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      securityOtps.set(slug.toLowerCase().trim(), { otp, expiresAt, mobile });

      const messageText = `🔒 *Restaurant Security Verification OTP*\n\nYour 6-Digit Verification Code is: *${otp}*\n\nUse this code to authorize sensitive changes (UPI ID / WhatsApp Settings). Valid for 5 minutes. Do NOT share with anyone!`;

      try {
        await whatsappService.sendMessage({ slug, mobile, messageText });
      } catch (err) {
        console.log(`[SECURITY OTP GENERATED for ${slug} (${mobile})]: ${otp}`);
      }

      return res.json({
        success: true,
        message: `Security OTP sent to your WhatsApp number (+91 ${mobile})! Please check your mobile.`,
      });
    } catch (error) {
      console.error('Error sending security OTP:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to send Security OTP' });
    }
  },

  /**
   * POST /api/whatsapp/verify-security-otp
   * Validates the 6-digit OTP for the given tenant slug.
   */
  async verifySecurityOtp(req, res) {
    try {
      const { slug = 'spice-garden', otp } = req.body;
      if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required' });
      }

      const stored = securityOtps.get(slug.toLowerCase().trim());
      if (!stored) {
        return res.status(400).json({ success: false, message: 'No OTP generated or OTP has expired. Request a new code.' });
      }

      if (Date.now() > stored.expiresAt) {
        securityOtps.delete(slug.toLowerCase().trim());
        return res.status(400).json({ success: false, message: 'Security OTP has expired. Request a new code.' });
      }

      if (stored.otp.trim() !== otp.trim()) {
        return res.status(400).json({ success: false, message: 'Incorrect 6-Digit Security OTP!' });
      }

      securityOtps.delete(slug.toLowerCase().trim());
      return res.json({ success: true, message: 'Security OTP verified successfully!' });
    } catch (error) {
      console.error('Error verifying security OTP:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

