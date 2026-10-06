import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_jwt_secret_key_orderflow_progix_2026_!@#$%';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Verifies JWT token and attaches user payload to request
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing. Please log in.',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.',
          expiredAt: err.expiredAt,
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Invalid session token. Access denied.',
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires one of roles: [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
};

/**
 * Sign JWT token for user session with explicit validity expiration
 */
export const signToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const getTokenValidity = () => JWT_EXPIRES_IN;
