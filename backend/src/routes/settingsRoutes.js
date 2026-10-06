import express from 'express';
import mongoose from 'mongoose';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { deleteMenuImage } from '../services/cloudinaryService.js';
import { db } from '../data/db.js';

const router = express.Router();

const DEFAULT_SLUG = 'spice-garden';

// Helper to get or create default settings safely
async function getOrCreateSettings(slug = DEFAULT_SLUG) {
  let settings = null;
  const cleanSlug = slug.toLowerCase().trim();

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      settings = await RestaurantSettings.findOne({ slug: cleanSlug });
      if (!settings) {
        settings = await RestaurantSettings.create({
          slug: cleanSlug,
          name: 'Spice Garden',
          restaurantName: 'Spice Garden',
          tagline: 'Authentic flavors, freshly prepared.',
          cuisine: 'North Indian • Chinese • Tandoor',
          rating: 4.8,
          reviewCount: 320,
          address: '14, Palm Grove Road, Indiranagar, Bengaluru',
          logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
          banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
          openTime: '11:30 AM',
          closeTime: '11:00 PM',
          isKitchenOpen: true,
          isAcceptingOrders: true,
        });
      }
    } catch (mErr) {
      console.warn('[SETTINGS] MongoDB query error:', mErr.message);
    }
  }

  if (!settings) {
    const restaurants = db.get('restaurants') || [];
    const localMatch = restaurants.find((r) => r.slug === cleanSlug) || restaurants[0] || {};
    settings = {
      slug: cleanSlug,
      name: localMatch.name || 'Spice Garden',
      restaurantName: localMatch.name || 'Spice Garden',
      tagline: localMatch.tagline || 'Authentic flavors, freshly prepared.',
      cuisine: localMatch.cuisine || 'North Indian • Chinese • Tandoor',
      rating: localMatch.rating || 4.8,
      reviewCount: localMatch.reviewCount || 320,
      address: localMatch.address || '14, Palm Grove Road, Indiranagar, Bengaluru',
      logo: localMatch.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
      banner: localMatch.banner || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      openTime: localMatch.openTime || '11:30 AM',
      closeTime: localMatch.closeTime || '11:00 PM',
      isKitchenOpen: localMatch.isKitchenOpen !== false,
      isAcceptingOrders: localMatch.isAcceptingOrders !== false,
      phone: localMatch.phone || '+91 98765 43210',
      email: localMatch.email || 'contact@spicegarden.com',
      gstin: localMatch.gstin || '29ABCDE1234F1Z5',
      upiId: localMatch.upiId || 'spicegarden@okhdfcbank',
    };
  }

  return settings;
}

/**
 * GET /api/settings/:slug?
 * Fetches restaurant settings
 */
router.get('/:slug?', async (req, res) => {
  try {
    const slug = req.params.slug || req.query.slug || DEFAULT_SLUG;
    const settings = await getOrCreateSettings(slug);
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
 * Updates restaurant settings and cleans up replaced Cloudinary images
 */
router.put('/:slug?', async (req, res) => {
  try {
    const slug = req.params.slug || req.body.slug || DEFAULT_SLUG;
    const cleanSlug = slug.toLowerCase().trim();
    const updateData = { ...req.body };

    // Normalize name / restaurantName
    if (updateData.name && !updateData.restaurantName) {
      updateData.restaurantName = updateData.name;
    } else if (updateData.restaurantName && !updateData.name) {
      updateData.name = updateData.restaurantName;
    }

    let saved = null;

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        let current = await RestaurantSettings.findOne({ slug: cleanSlug });
        if (!current) {
          current = new RestaurantSettings({ slug: cleanSlug });
        }

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

    // Always update local db.json as local backup sync
    try {
      const localRestaurants = db.get('restaurants') || [];
      const updatedLocal = localRestaurants.map((r) => {
        if (r.slug === cleanSlug) {
          return { ...r, ...updateData };
        }
        return r;
      });
      db.set('restaurants', updatedLocal);
    } catch (dbErr) {
      console.warn('Local db sync warning for settings:', dbErr.message);
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
