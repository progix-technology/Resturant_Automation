import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.js';
import { MenuCategory } from '../models/MenuCategory.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { Tenant } from '../models/Tenant.js';
import { deleteMenuImage } from '../services/cloudinaryService.js';

export const menuController = {
  /**
   * Get menu items and categories strictly scoped by restaurant slug
   */
  async getMenu(req, res) {
    try {
      const { slug } = req.query;
      const rawSlug = (slug || 'spice-garden').toLowerCase().trim();
      const cleanSlug = rawSlug.replace(/^the-/, '').replace(/_/g, '-');

      // 1. Verify restaurant existence in MongoDB Atlas
      const isRegistered =
        cleanSlug === 'spice-garden' ||
        (await RestaurantSettings.findOne({
          $or: [{ slug: cleanSlug }, { slug: rawSlug }, { slug: `the-${cleanSlug}` }],
        })) ||
        (await Tenant.findOne({
          $or: [{ slug: cleanSlug }, { slug: rawSlug }, { slug: `the-${cleanSlug}` }],
        }));

      if (!isRegistered) {
        return res.status(404).json({
          success: false,
          message: `Restaurant "${slug}" not found.`,
          categories: [],
          items: [],
        });
      }

      // 2. Query Menu Items for this restaurant
      const atlasItems = await MenuItem.find({
        $or: [{ restaurantSlug: cleanSlug }, { restaurantSlug: rawSlug }, { restaurantSlug: `the-${cleanSlug}` }],
      }).lean();

      // 3. Query Categories for this restaurant
      let categories = await MenuCategory.find({
        $or: [{ restaurantSlug: cleanSlug }, { restaurantSlug: 'spice-garden' }],
      }).sort({ sortOrder: 1 }).lean();

      if (!categories || categories.length === 0) {
        categories = [
          { id: 'cat-starters', name: 'Starters & Appetizers', sortOrder: 1 },
          { id: 'cat-mains', name: 'Main Course Specialties', sortOrder: 2 },
          { id: 'cat-breads', name: 'Breads & Rice', sortOrder: 3 },
          { id: 'cat-beverages', name: 'Beverages & Mocktails', sortOrder: 4 },
          { id: 'cat-desserts', name: 'Desserts & Sweets', sortOrder: 5 },
        ];
      } else {
        categories = categories.map((c) => ({
          ...c,
          id: c.categoryId || c._id.toString(),
        }));
      }

      const formattedItems = atlasItems.map((i) => {
        const catMatch = categories.find(
          (c) => c.name.toLowerCase() === (i.category || '').toLowerCase()
        );
        return {
          ...i,
          id: i.itemId || i._id.toString(),
          itemId: i.itemId || i._id.toString(),
          categoryId: catMatch?.id || i.categoryId || 'cat-starters',
        };
      });

      return res.status(200).json({
        success: true,
        categories,
        items: formattedItems,
      });
    } catch (err) {
      console.error('getMenu error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch menu' });
    }
  },

  /**
   * Toggle item availability (Multi-Tenant Protected)
   */
  async toggleAvailability(req, res) {
    try {
      const { id } = req.params;
      const cleanId = String(id).trim();

      const item = await MenuItem.findOne({
        $or: [{ itemId: cleanId }, { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null }],
      });

      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      // Multi-Tenant Isolation Check
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
      const userSlug = (req.user?.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();
      const itemSlug = (item.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();

      if (!isSuper && userSlug && itemSlug && userSlug !== itemSlug) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot modify another restaurant\'s menu item.',
        });
      }

      item.isAvailable = !item.isAvailable;
      await item.save();

      return res.status(200).json({
        success: true,
        message: 'Item availability updated',
        data: {
          ...item.toObject(),
          id: item.itemId,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update item availability' });
    }
  },

  /**
   * Save or update menu item in MongoDB Atlas (Multi-Tenant Protected)
   */
  async saveMenuItem(req, res) {
    try {
      const { id } = req.params;
      const itemData = req.body;
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';

      // Strict Tenant Assignment: Restaurant Admins are locked to their JWT token slug
      const cleanSlug = isSuper
        ? (itemData.restaurantSlug || req.user?.restaurantSlug || 'spice-garden').toLowerCase().trim()
        : (req.user?.restaurantSlug || 'spice-garden').toLowerCase().trim();

      if (id) {
        // Update existing item
        const existing = await MenuItem.findOne({
          $or: [{ itemId: id }, { _id: mongoose.isValidObjectId(id) ? id : null }],
        });

        if (!existing) {
          return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Multi-Tenant Isolation Check
        const userSlug = (req.user?.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();
        const existingSlug = (existing.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();

        if (!isSuper && userSlug && existingSlug && userSlug !== existingSlug) {
          return res.status(403).json({
            success: false,
            message: 'Access Denied: You cannot edit items belonging to another restaurant.',
          });
        }

        if (existing.image && itemData.image && existing.image !== itemData.image && existing.image.includes('cloudinary.com')) {
          deleteMenuImage(existing.image).catch(() => {});
        }

        const updated = await MenuItem.findOneAndUpdate(
          { _id: existing._id },
          {
            ...itemData,
            restaurantSlug: existing.restaurantSlug, // Preserve original authentic tenant slug
          },
          { new: true }
        ).lean();

        return res.status(200).json({
          success: true,
          message: 'Menu item updated successfully',
          data: {
            ...updated,
            id: updated.itemId,
          },
        });
      } else {
        // Create new item strictly under admin's tenant slug
        const itemId = `item-${Date.now().toString(36)}`;
        const newItem = await MenuItem.create({
          ...itemData,
          itemId,
          restaurantSlug: cleanSlug,
          name: itemData.name || 'New Dish',
          category: itemData.category || 'Specialties',
          price: Number(itemData.price) || 0,
          isAvailable: itemData.isAvailable !== false,
          isVeg: itemData.isVeg !== false,
        });

        return res.status(201).json({
          success: true,
          message: 'Dish added to menu successfully',
          data: {
            ...newItem.toObject(),
            id: newItem.itemId,
          },
        });
      }
    } catch (err) {
      console.error('saveMenuItem error:', err);
      return res.status(500).json({ success: false, message: 'Failed to save menu item' });
    }
  },

  /**
   * Delete menu item (Multi-Tenant Protected)
   */
  async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;
      const cleanId = String(id).trim();

      const item = await MenuItem.findOne({
        $or: [{ itemId: cleanId }, { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null }],
      });

      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      // Multi-Tenant Isolation Check
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
      const userSlug = (req.user?.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();
      const itemSlug = (item.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();

      if (!isSuper && userSlug && itemSlug && userSlug !== itemSlug) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot delete items belonging to another restaurant.',
        });
      }

      if (item.image && item.image.includes('cloudinary.com')) {
        deleteMenuImage(item.image).catch(() => {});
      }

      await MenuItem.deleteOne({ _id: item._id });

      return res.status(200).json({
        success: true,
        message: 'Menu item deleted successfully',
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete menu item' });
    }
  },

  /**
   * Get categories
   */
  async getCategories(req, res) {
    try {
      const rawSlug = (req.query.slug || req.user?.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const cleanSlug = rawSlug.replace(/^the-/, '').replace(/_/g, '-');

      let categories = await MenuCategory.find({
        $or: [{ restaurantSlug: cleanSlug }, { restaurantSlug: 'spice-garden' }],
      }).sort({ sortOrder: 1 }).lean();

      return res.status(200).json({
        success: true,
        categories: categories.map((c) => ({
          ...c,
          id: c.categoryId || c._id.toString(),
        })),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  },

  /**
   * Add new category
   */
  async addCategory(req, res) {
    try {
      const { name, icon } = req.body;
      const rawSlug = (req.body.restaurantSlug || req.user?.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const cleanSlug = rawSlug.replace(/^the-/, '').replace(/_/g, '-');

      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }

      const categoryId = `cat-${name.toLowerCase().replace(/\s+/g, '-')}`;

      const created = await MenuCategory.findOneAndUpdate(
        { categoryId, restaurantSlug: cleanSlug },
        {
          categoryId,
          name,
          icon: icon || 'Utensils',
          restaurantSlug: cleanSlug,
        },
        { upsert: true, new: true }
      ).lean();

      return res.status(201).json({
        success: true,
        message: 'Category added successfully',
        data: {
          ...created,
          id: created.categoryId,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to add category' });
    }
  },

  /**
   * Delete category
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      await MenuCategory.deleteOne({ categoryId: id });
      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
  },
};
