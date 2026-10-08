import mongoose from 'mongoose';
import { db } from '../data/db.js';
import { MenuItem } from '../models/MenuItem.js';
import { deleteMenuImage } from '../services/cloudinaryService.js';

export const menuController = {
  async getMenu(req, res) {
    try {
      const { slug } = req.query;
      let items = [];

      // 1. Try fetching from MongoDB Atlas ONLY if connection is active
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const cleanSlug = slug ? slug.replace(/^the-/, '') : '';
          const query = slug
            ? { $or: [{ restaurantSlug: slug }, { restaurantSlug: cleanSlug }, { restaurantSlug: `the-${cleanSlug}` }] }
            : {};
          const atlasItems = await MenuItem.find(query).lean();


          if (atlasItems && atlasItems.length > 0) {
            items = atlasItems.map((i) => ({
              id: i.itemId || i._id.toString(),
              itemId: i.itemId || i._id.toString(),
              name: i.name,
              category: i.category,
              categoryId: i.categoryId || i.category,
              price: i.price,
              description: i.description || '',
              image: i.image || '',
              isVeg: i.isVeg ?? true,
              isSpicy: i.isSpicy ?? false,
              isRecommended: i.isRecommended ?? i.isPopular ?? false,
              isAvailable: i.isAvailable ?? true,
              preparationTime: i.preparationTime || '15 mins',
              addons: i.addons || [],
              rating: i.rating || 4.8,
            }));
          }
        } catch (dbErr) {
          // Fall back to local store
        }
      }

      // 2. Fallback to local db if Atlas returned empty or is offline
      if (items.length === 0) {
        items = db.get('menuItems') || [];
        if (slug) {
          const cleanSlug = slug.replace(/^the-/, '');
          items = items.filter(
            (i) =>
              i.restaurantSlug === slug ||
              i.restaurantSlug === cleanSlug ||
              i.restaurantSlug === `the-${cleanSlug}` ||
              !i.restaurantSlug
          );
        }
      }

      const categories = db.get('menuCategories') || [];

      // Ensure every item has a matching categoryId from categories
      items = items.map((i) => {
        const catMatch = categories.find(
          (c) => c.name.toLowerCase() === (i.category || '').toLowerCase()
        );
        return {
          ...i,
          categoryId: catMatch?.id || i.categoryId || 'cat-starters',
        };
      });

      return res.status(200).json({
        success: true,
        categories,
        items,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch menu' });
    }
  },

  async toggleAvailability(req, res) {
    try {
      const { id } = req.params;
      const items = db.get('menuItems') || [];
      let updatedItem = null;

      const nextItems = items.map((i) => {
        if (i.id === id || i.itemId === id) {
          updatedItem = { ...i, isAvailable: !i.isAvailable };
          return updatedItem;
        }
        return i;
      });

      db.set('menuItems', nextItems);

      // Respond immediately to client (0ms)
      res.status(200).json({
        success: true,
        message: `Item availability updated`,
        data: updatedItem,
      });

      // Asynchronous background sync with MongoDB Atlas (non-blocking)
      if (mongoose.connection && mongoose.connection.readyState === 1 && updatedItem) {
        MenuItem.findOne({ $or: [{ itemId: id }, { _id: id }] })
          .then((doc) => {
            if (doc) {
              doc.isAvailable = updatedItem.isAvailable;
              return doc.save();
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to update item' });
      }
    }
  },

  async saveMenuItem(req, res) {
    try {
      const { id } = req.params;
      const itemData = req.body;
      const items = db.get('menuItems') || [];

      if (id) {
        // === UPDATE DISH ===
        const existingItem = items.find((i) => i.id === id || i.itemId === id);

        // Delete old Cloudinary photo if replaced
        if (
          existingItem &&
          existingItem.image &&
          itemData.image &&
          existingItem.image !== itemData.image &&
          existingItem.image.includes('cloudinary.com')
        ) {
          deleteMenuImage(existingItem.image).catch(() => {});
        }

        let updated = null;
        const next = items.map((i) => {
          if (i.id === id || i.itemId === id) {
            updated = { ...i, ...itemData, id };
            return updated;
          }
          return i;
        });

        if (!updated) {
          updated = { ...itemData, id };
          next.push(updated);
        }

        db.set('menuItems', next);

        // Respond immediately (0ms)
        res.status(200).json({ success: true, data: updated });

        // Background sync to MongoDB Atlas
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          MenuItem.findOneAndUpdate(
            { $or: [{ itemId: id }, { _id: id }] },
            {
              name: itemData.name,
              category: itemData.category || itemData.categoryId,
              price: Number(itemData.price),
              description: itemData.description || '',
              image: itemData.image || '',
              isVeg: itemData.isVeg ?? true,
              isRecommended: itemData.isRecommended ?? false,
              isAddon: itemData.isAddon ?? false,
              isAvailable: itemData.isAvailable ?? true,
              variants: itemData.variants || [],
              preparationTime: Number(String(itemData.preparationTime || 15).replace(/\D/g, '') || 15),
            },
            { upsert: true }
          ).catch(() => {});
        }
      } else {
        // === CREATE DISH ===
        const newItemId = `item-${Date.now().toString().slice(-6)}`;
        const newItem = {
          ...itemData,
          id: newItemId,
          itemId: newItemId,
          price: Number(itemData.price),
          isAvailable: itemData.isAvailable !== false,
          isRecommended: Boolean(itemData.isRecommended),
          isAddon: Boolean(itemData.isAddon),
          variants: itemData.variants || [],
          restaurantSlug: itemData.restaurantSlug || 'spice-garden',
        };

        db.set('menuItems', [newItem, ...items]);

        // Respond immediately (0ms)
        res.status(201).json({ success: true, data: newItem });

        // Background save to MongoDB Atlas
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          MenuItem.create({
            itemId: newItemId,
            restaurantSlug: newItem.restaurantSlug,
            name: newItem.name,
            category: newItem.category || newItem.categoryId || 'starters',
            price: newItem.price,
            description: newItem.description || '',
            image: newItem.image || '',
            isVeg: newItem.isVeg ?? true,
            isRecommended: newItem.isRecommended ?? false,
            isAddon: newItem.isAddon ?? false,
            isAvailable: newItem.isAvailable ?? true,
            variants: newItem.variants || [],
            preparationTime: Number(String(newItem.preparationTime || 15).replace(/\D/g, '') || 15),
          }).catch(() => {});
        }
      }
    } catch (err) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to save menu item' });
      }
    }
  },

  async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;
      const items = db.get('menuItems') || [];
      const targetItem = items.find((i) => i.id === id || i.itemId === id);

      if (targetItem && targetItem.image && targetItem.image.includes('cloudinary.com')) {
        deleteMenuImage(targetItem.image).catch(() => {});
      }

      // 1. Delete from local JSON / cache immediately
      const filtered = items.filter((i) => i.id !== id && i.itemId !== id);
      db.set('menuItems', filtered);

      // 2. Respond immediately
      res.status(200).json({
        success: true,
        message: `Dish #${id} deleted successfully`,
      });

      // 3. Delete from MongoDB Atlas in background
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        MenuItem.deleteOne({ $or: [{ itemId: id }, { _id: id }] }).catch(() => {});
      }
    } catch (err) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to delete item' });
      }
    }
  },

  async getCategories(req, res) {
    try {
      const categories = db.get('menuCategories') || [];
      res.status(200).json({ success: true, categories });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  },

  async addCategory(req, res) {
    try {
      const { name, id, icon } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      const categoryId = (id || name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const categories = db.get('menuCategories') || [];
      const exists = categories.find((c) => c.id === categoryId);
      if (exists) {
        return res.status(400).json({ success: false, message: 'Category already exists' });
      }

      const newCategory = {
        id: categoryId,
        name: name.trim(),
        icon: icon || 'Utensils',
        sortOrder: categories.length + 1,
      };

      categories.push(newCategory);
      db.set('menuCategories', categories);

      res.status(201).json({
        success: true,
        message: 'Category added successfully',
        category: newCategory,
        categories,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      let categories = db.get('menuCategories') || [];
      categories = categories.filter((c) => c.id !== id);
      db.set('menuCategories', categories);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        categories,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
