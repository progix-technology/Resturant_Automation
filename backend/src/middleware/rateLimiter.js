import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication Endpoints (Brute Force Protection)
 * Max 15 login attempts per 15-minute window per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    securityNotice: 'Rate limiting active to prevent unauthorised brute force events',
  },
});

/**
 * Strict Rate Limiter for OTP Requests (Anti-Spam & SMS/WhatsApp Abuse Protection)
 * Max 5 OTP requests per 10-minute window per IP
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests from this device. Please wait 10 minutes before requesting another OTP.',
    securityNotice: 'Anti-abuse rate limiting active on OTP endpoints',
  },
});

/**
 * Strict Rate Limiter for Order Creation (Anti-DDoS & Order Flood Protection)
 * Max 10 orders per 1-minute window per IP
 */
export const orderCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 orders per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many orders submitted in a short period. Please wait a minute before placing another order.',
    securityNotice: 'Order flood protection active',
  },
});

/**
 * General API Rate Limiter
 * Generous limit (10,000 requests per 15-minute window) so admin live polling and file uploads are never blocked
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // 10k requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'High traffic detected from this IP. Please slow down your requests.',
  },
});

