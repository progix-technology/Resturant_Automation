import mongoose from 'mongoose';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { RestaurantAdmin } from '../models/RestaurantAdmin.js';
import { Tenant } from '../models/Tenant.js';
import { comparePassword, hashPassword } from '../utils/passwordUtils.js';
import { signToken, getTokenValidity } from '../middleware/authMiddleware.js';

export const authController = {
  /**
   * SuperAdmin Login (MongoDB Atlas Authoritative)
   * Accepts progixtechnology@gmail.com / Progix@123
   */
  async loginSuperAdmin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Query Live MongoDB Atlas
      const superAdmin = await SuperAdmin.findOne({ email: cleanEmail }).lean();

      if (!superAdmin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid SuperAdmin email or unauthorized account.',
        });
      }

      // Secure bcrypt password verification
      const isMatch = comparePassword(password, superAdmin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Access denied.',
        });
      }

      const validity = getTokenValidity();

      // Generate JWT with configured validity
      const token = signToken({
        id: superAdmin.id || superAdmin._id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: superAdmin.role,
        type: 'PLATFORM_SUPERADMIN',
        isProtected: superAdmin.isProtected || superAdmin.email === 'progixtechnology@gmail.com',
      });

      return res.status(200).json({
        success: true,
        message: 'SuperAdmin authentication successful',
        token,
        tokenValidity: validity,
        user: {
          id: superAdmin.id || superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
          title: superAdmin.title,
          avatar: superAdmin.avatar,
          company: superAdmin.company,
          isProtected: superAdmin.isProtected || superAdmin.email === 'progixtechnology@gmail.com',
        },
      });
    } catch (err) {
      console.error('SuperAdmin login error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
      });
    }
  },

  /**
   * Restaurant Admin Login (MongoDB Atlas Authoritative)
   * Accepts resturant1@gmail.com / 123123 or onboarded tenant credentials
   */
  async loginRestaurantAdmin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      let admin = await RestaurantAdmin.findOne({ email: cleanEmail }).lean();

      // Check Tenant if not in RestaurantAdmin
      if (!admin) {
        const tenantMatch = await Tenant.findOne({
          $or: [
            { ownerEmail: cleanEmail },
            { slug: cleanEmail.replace(/@restaurant\.com$/, '') },
          ],
        }).lean();

        if (tenantMatch) {
          const ownerPass = tenantMatch.ownerPassword || 'Admin@123';
          admin = {
            id: `adm-${tenantMatch.tenantId || tenantMatch._id}`,
            name: tenantMatch.ownerName || tenantMatch.name,
            email: tenantMatch.ownerEmail || `${tenantMatch.slug}@restaurant.com`,
            passwordHash: hashPassword(ownerPass),
            role: 'ADMIN',
            title: 'Restaurant Owner & Admin',
            restaurantId: tenantMatch.tenantId || tenantMatch._id.toString(),
            restaurantSlug: tenantMatch.slug,
          };
        }
      }

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Restaurant Admin account not found. Please check your credentials.',
        });
      }

      // Secure bcrypt password verification
      const isMatch = comparePassword(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Access denied.',
        });
      }

      const validity = getTokenValidity();

      // Generate JWT with configured validity
      const token = signToken({
        id: admin.id || admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        type: 'RESTAURANT_ADMIN',
        restaurantId: admin.restaurantId,
        restaurantSlug: admin.restaurantSlug,
      });

      return res.status(200).json({
        success: true,
        message: 'Restaurant Admin authentication successful',
        token,
        tokenValidity: validity,
        user: {
          id: admin.id || admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          title: admin.title,
          avatar: admin.avatar,
          restaurantId: admin.restaurantId,
          restaurantSlug: admin.restaurantSlug,
        },
      });
    } catch (err) {
      console.error('Restaurant Admin login error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
      });
    }
  },

  /**
   * Get Current Authenticated Profile from Token
   */
  async getProfile(req, res) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User session not found or token expired',
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          type: user.type,
          restaurantId: user.restaurantId,
          restaurantSlug: user.restaurantSlug,
          isProtected: user.isProtected || false,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
      });
    }
  },

  /**
   * Verify Active Session & Token Validity
   */
  async verifySession(req, res) {
    return authController.getProfile(req, res);
  },

  /**
   * Verify Admin Password
   */
  async verifyAdminPassword(req, res) {
    try {
      const email = req.body?.email || req.user?.email;
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
      }

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      let admin = await RestaurantAdmin.findOne({ email: cleanEmail }).lean();
      if (!admin) {
        admin = await SuperAdmin.findOne({ email: cleanEmail }).lean();
      }

      // Check dynamic Tenant records
      if (!admin) {
        const tenantMatch = await Tenant.findOne({
          $or: [
            { ownerEmail: cleanEmail },
            { contactEmail: cleanEmail },
            { slug: cleanEmail.split('@')[0] },
          ],
        }).lean();

        if (tenantMatch) {
          const ownerPass = tenantMatch.ownerPassword || 'Admin@123';
          admin = {
            email: cleanEmail,
            passwordHash: hashPassword(ownerPass),
          };
        }
      }

      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin account not found.' });
      }

      const isMatch = comparePassword(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect Admin Password!' });
      }

      return res.status(200).json({ success: true, message: 'Password verified successfully.' });
    } catch (err) {
      console.error('Verify admin password error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error during verification.' });
    }
  },
};
