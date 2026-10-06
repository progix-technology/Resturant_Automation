import mongoose from 'mongoose';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { RestaurantAdmin } from '../models/RestaurantAdmin.js';
import { db } from '../data/db.js';
import { comparePassword } from '../utils/passwordUtils.js';
import { signToken, getTokenValidity } from '../middleware/authMiddleware.js';

export const authController = {

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

      // 1. Try local store first (instant 0ms)
      const localAdmins = db.get('superAdmins') || [];
      let superAdmin = localAdmins.find((sa) => sa.email.toLowerCase() === cleanEmail);

      // 2. If not found locally and Atlas is connected, check Atlas
      if (!superAdmin && mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          superAdmin = await SuperAdmin.findOne({ email: cleanEmail }).lean();
        } catch (dbErr) {
          // Fallback
        }
      }

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
   * Restaurant Admin Login
   * Accepts resturant1@gmail.com / 123123
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

      // 1. Try local store first (instant 0ms)
      const localAdmins = db.get('restaurantAdmins') || [];
      let admin = localAdmins.find((a) => a.email.toLowerCase() === cleanEmail);

      // 1b. Check platformTenants if not found in restaurantAdmins
      if (!admin) {
        const tenants = db.get('platformTenants') || [];
        const tenantMatch = tenants.find(
          (t) => (t.ownerEmail && t.ownerEmail.toLowerCase() === cleanEmail) ||
            (t.slug && `${t.slug.toLowerCase()}@restaurant.com` === cleanEmail)
        );

        if (tenantMatch) {
          const ownerPass = tenantMatch.ownerPassword || 'Admin@123';
          admin = {
            id: `adm-${tenantMatch.id}`,
            name: tenantMatch.ownerName || tenantMatch.name,
            email: tenantMatch.ownerEmail || `${tenantMatch.slug}@restaurant.com`,
            passwordHash: hashPassword(ownerPass),
            passwordPlain: ownerPass,
            role: 'ADMIN',
            title: 'Restaurant Owner & Admin',
            restaurantId: tenantMatch.id,
            restaurantSlug: tenantMatch.slug,
          };
        }
      }

      // 2. If not found locally and Atlas is connected, check Atlas
      if (!admin && mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          admin = await RestaurantAdmin.findOne({ email: cleanEmail }).lean();
        } catch (dbErr) {
          // Fallback
        }
      }

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid restaurant staff email or unregistered diner account',
        });
      }

      // Secure bcrypt password verification
      const isMatch = comparePassword(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password. Please verify your credentials.',
        });
      }

      const validity = getTokenValidity();

      // Generate JWT with configured validity
      const token = signToken({
        id: admin.id || admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        restaurantId: admin.restaurantId,
        type: 'RESTAURANT_ADMIN',
      });

      return res.status(200).json({
        success: true,
        message: 'Restaurant admin authentication successful',
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
   * Verify Active Session Token
   */
  async verifySession(req, res) {
    return res.status(200).json({
      success: true,
      user: req.user,
      tokenValidity: getTokenValidity(),
    });
  },

  /**
   * Verify Admin Password before sensitive actions (e.g. changing UPI ID or WhatsApp Login)
   */
  async verifyAdminPassword(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const localAdmins = db.get('restaurantAdmins') || [];
      let admin = localAdmins.find((a) => a.email.toLowerCase() === cleanEmail);

      if (!admin) {
        const superAdmins = db.get('superAdmins') || [];
        admin = superAdmins.find((sa) => sa.email.toLowerCase() === cleanEmail);
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

