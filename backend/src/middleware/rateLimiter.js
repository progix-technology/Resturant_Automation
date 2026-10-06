import rateLimit from 'express-rate-limit';

/**
 * Strict Rate Limiter for Authentication Endpoints (Brute Force Protection)
 * Max 10 login attempts per 15-minute window per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    securityNotice: 'Rate limiting active to prevent unauthorised brute force events',
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

