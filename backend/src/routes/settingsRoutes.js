import express from 'express';
import mongoose from 'mongoose';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { Tenant } from '../models/Tenant.js';
import { deleteMenuImage } from '../services/cloudinaryService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const DEFAULT_SLUG = 'spice-garden';

// Helper to find existing restaurant settings strictly without fabricating non-existent restaurants
async function getRestaurantSettings(slug = DEFAULT_SLUG) {
  let settings = null;
  const rawSlug = (slug || DEFAULT_SLUG).toLowerCase().trim();
  const cleanSlug = rawSlug.replace(/_/g, '-');

  // 1. Check MongoDB Atlas RestaurantSettings if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      settings = await RestaurantSettings.findOne({
        $or: [{ slug: cleanSlug }, { slug: rawSlug }],
      }).lean();
    } catch (mErr) {
      console.warn('[SETTINGS] MongoDB query error:', mErr.message);
    }

    // Check Tenant model in MongoDB Atlas if not found in RestaurantSettings
    if (!settings) {
      try {
        const mongoTenant = await Tenant.findOne({
          $or: [{ slug: cleanSlug }, { slug: rawSlug }],
        }).lean();
        if (mongoTenant) {
          settings = {
            slug: cleanSlug,
            name: mongoTenant.name,
            restaurantName: mongoTenant.name,
            tagline: mongoTenant.tagline || '',
            cuisine: mongoTenant.cuisine || 'Multi-Cuisine',
            rating: 4.8,
            reviewCount: 50,
            address: mongoTenant.address || mongoTenant.city || '',
            logo: mongoTenant.logo || '',
            banner: mongoTenant.banner || '',
            openTime: '11:00 AM',
            closeTime: '11:00 PM',
            isKitchenOpen: true,
            isAcceptingOrders: mongoTenant.status === 'ACTIVE',
            phone: mongoTenant.ownerPhone || '',
            email: mongoTenant.ownerEmail || '',
            planId: mongoTenant.planId || 'plan-starter',
            planName: mongoTenant.planName || 'Starter QR',
          };
        }
      } catch (tErr) {
        console.warn('[SETTINGS] MongoDB Tenant query error:', tErr.message);
      }
    }
  }

  // 2. Default seed restaurant fallback only for 'spice-garden'
  if (!settings && (cleanSlug === 'spice-garden' || cleanSlug === 'the-spice-garden')) {
    settings = {
      slug: 'spice-garden',
      name: 'The Spice Garden',
      restaurantName: 'The Spice Garden',
      tagline: 'Authentic Indian Flavours & Contemporary Tandoor',
      cuisine: 'North Indian • Chinese • Tandoor',
      rating: 4.8,
      reviewCount: 320,
      address: 'Shop 14, High Street Avenue, Indiranagar, Bengaluru, 560038',
      logo: '🌿',
      banner: '',
      openTime: '11:00 AM',
      closeTime: '11:00 PM',
      isKitchenOpen: true,
      isAcceptingOrders: true,
      phone: '+91 98765 43210',
      email: 'contact@spicegarden.com',
      gstin: '29ABCDE1234F1Z5',
      upiId: 'spicegarden@okhdfcbank',
      planId: 'plan-growth',
      planName: 'Growth Pro',
    };
  }

  // Sync tenant's SaaS plan info if available in MongoDB Atlas
  if (settings) {
    try {
      const tenantMatch = await Tenant.findOne({
        $or: [{ slug: cleanSlug }, { slug: rawSlug }],
      }).lean();
      if (tenantMatch) {
        settings = {
          ...settings,
          planId: tenantMatch.planId || settings.planId || 'plan-starter',
          planName: tenantMatch.planName || settings.planName || 'Starter QR',
        };
      }
    } catch (e) {}
  }

  return settings;
}

/**
 * GET /api/settings/:slug?
 * Fetches restaurant settings (Returns 404 if restaurant does not exist)
 */
router.get('/:slug?', async (req, res) => {
  try {
    const slug = req.params.slug || req.query.slug || DEFAULT_SLUG;
    const settings = await getRestaurantSettings(slug);

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: `Restaurant "${slug}" not found. Please verify the QR code scanned.`,
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch settings',
    });
  }
});

/**
 * PUT /api/settings/:slug?
 * Updates restaurant settings and cleans up replaced Cloudinary images (Protected - Admin only)
 */
router.put('/:slug?', authenticateToken, async (req, res) => {
  try {
    const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
    const paramSlug = (req.params.slug || req.body.slug || '').toLowerCase().trim().replace(/_/g, '-');
    const userSlug = (req.user?.restaurantSlug || '').toLowerCase().trim().replace(/_/g, '-');

    // Multi-Tenant Isolation Check: Admin cannot modify settings of another restaurant
    if (!isSuper && userSlug && paramSlug && userSlug !== paramSlug) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You cannot modify another restaurant\'s settings.',
      });
    }

    const cleanSlug = isSuper ? (paramSlug || userSlug || DEFAULT_SLUG) : (userSlug || DEFAULT_SLUG);
    const rawSlug = cleanSlug;
    const updateData = { ...req.body, slug: cleanSlug };

    // Normalize name / restaurantName
    if (updateData.name && !updateData.restaurantName) {
      updateData.restaurantName = updateData.name;
    } else if (updateData.restaurantName && !updateData.name) {
      updateData.name = updateData.restaurantName;
    }

    let saved = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        let current = await RestaurantSettings.findOne({
          $or: [{ slug: cleanSlug }, { slug: rawSlug }],
        });
        if (!current) {
          current = new RestaurantSettings({ slug: cleanSlug });
        }
        current.slug = cleanSlug;

        // Auto-cleanup old logo if replaced
        if (updateData.logo && current.logo && updateData.logo !== current.logo) {
          if (current.logo.includes('res.cloudinary.com')) {
            deleteMenuImage(current.logo).catch((err) =>
              console.warn('[SETTINGS WARNING] Failed to delete old logo:', err.message)
            );
          }
        }

        // Auto-cleanup old banner if replaced
        if (updateData.banner && current.banner && updateData.banner !== current.banner) {
          if (current.banner.includes('res.cloudinary.com')) {
            deleteMenuImage(current.banner).catch((err) =>
              console.warn('[SETTINGS WARNING] Failed to delete old banner:', err.message)
            );
          }
        }

        Object.assign(current, updateData);
        saved = await current.save();
      } catch (dbErr) {
        console.warn('[SETTINGS PUT] MongoDB save warning:', dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Restaurant settings updated successfully',
      settings: saved || updateData,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update settings',
    });
  }
});

export default router;
