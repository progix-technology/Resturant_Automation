import mongoose from 'mongoose';
import { db } from '../data/db.js';
import { Tenant } from '../models/Tenant.js';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { RestaurantAdmin } from '../models/RestaurantAdmin.js';
import { MenuItem } from '../models/MenuItem.js';
import { hashPassword } from '../utils/passwordUtils.js';

export const superAdminController = {
  // Tenants
  async getTenants(req, res) {
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const mongoPromise = Tenant.find().sort({ createdAt: -1 }).lean();
          const timerPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Atlas query timeout')), 300)
          );
          const mongoTenants = await Promise.race([mongoPromise, timerPromise]);
          if (mongoTenants && mongoTenants.length > 0) {
            return res.status(200).json({ success: true, count: mongoTenants.length, data: mongoTenants });
          }
        } catch (mErr) {
          // Fallback
        }
      }

      const tenants = db.get('platformTenants') || [];
      return res.status(200).json({ success: true, count: tenants.length, data: tenants });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch tenants' });
    }
  },

  async addTenant(req, res) {
    try {
      const tenantData = req.body;
      const tenantId = `tenant-${Date.now().toString().slice(-4)}`;
      const slug = (tenantData.slug || `rest-${Date.now().toString().slice(-4)}`).toLowerCase().trim();

      const ownerEmail = (tenantData.ownerEmail && tenantData.ownerEmail.includes('@')) 
        ? tenantData.ownerEmail.trim().toLowerCase() 
        : `${slug}@restaurant.com`;
      const ownerPassword = tenantData.ownerPassword || 'Admin@123';

      const newTenant = {
        ...tenantData,
        tenantId,
        id: tenantId,
        slug,
        ownerEmail,
        ownerPassword,
        status: tenantData.status || 'ACTIVE',
        activeTables: Number(tenantData.activeTables) || 15,
        monthlyOrders: 0,
        monthlyGMV: 0,
        renewalDate: tenantData.renewalDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      };

      // 1. Save tenant to local db
      const tenants = db.get('platformTenants') || [];
      db.set('platformTenants', [newTenant, ...tenants]);

      // 2. Auto-create Restaurant Admin account
      const existingAdmins = db.get('restaurantAdmins') || [];
      const newAdmin = {
        id: `adm-${Date.now().toString().slice(-4)}`,
        name: tenantData.ownerName || tenantData.name,
        email: ownerEmail,
        passwordHash: hashPassword(ownerPassword),
        passwordPlain: ownerPassword,
        role: 'ADMIN',
        title: 'Restaurant Owner & Admin',
        restaurantId: tenantId,
        restaurantSlug: slug,
      };
      db.set('restaurantAdmins', [newAdmin, ...existingAdmins]);

      // 3. Auto-seed starter menu items for this restaurant slug
      const existingMenuItems = db.get('menuItems') || [];
      const defaultStarterMenuItems = [
        {
          id: `item-${slug}-101`,
          restaurantSlug: slug,
          name: 'Crispy Corn Chilli Pepper',
          category: 'Starters & Appetizers',
          price: 240,
          description: 'Golden sweet corn kernels tossed with crunchy bell peppers, spring onion, and crushed black pepper.',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
          isVeg: true,
          isSpicy: true,
          isPopular: true,
          isAvailable: true,
          preparationTime: 15,
        },
        {
          id: `item-${slug}-102`,
          restaurantSlug: slug,
          name: 'Paneer Tikka Angara',
          category: 'Starters & Appetizers',
          price: 320,
          description: 'Smoky char-grilled cottage cheese cubes marinated in fiery red spices and hung curd.',
          image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=500&q=80',
          isVeg: true,
          isSpicy: true,
          isPopular: true,
          isAvailable: true,
          preparationTime: 20,
        },
        {
          id: `item-${slug}-201`,
          restaurantSlug: slug,
          name: 'Paneer Butter Masala',
          category: 'Main Course Specialties',
          price: 340,
          description: 'Succulent malai paneer simmered in a velvety, rich tomato cashew butter gravy.',
          image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80',
          isVeg: true,
          isSpicy: false,
          isPopular: true,
          isAvailable: true,
          preparationTime: 20,
        },
        {
          id: `item-${slug}-301`,
          restaurantSlug: slug,
          name: 'Butter Garlic Naan',
          category: 'Breads & Rice',
          price: 75,
          description: 'Tandoor-baked leavened flatbread topped with roasted garlic flakes and melted salted butter.',
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80',
          isVeg: true,
          isSpicy: false,
          isPopular: true,
          isAvailable: true,
          preparationTime: 10,
        },
        {
          id: `item-${slug}-401`,
          restaurantSlug: slug,
          name: 'Fresh Mint Lime Mojito',
          category: 'Beverages & Mocktails',
          price: 150,
          description: 'Refreshing sparkling cooler muddled with fresh garden mint sprigs, lime wedges, and cane syrup.',
          image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=500&q=80',
          isVeg: true,
          isSpicy: false,
          isPopular: true,
          isAvailable: true,
          preparationTime: 8,
        },
      ];
      db.set('menuItems', [...defaultStarterMenuItems, ...existingMenuItems]);

      res.status(201).json({ success: true, data: newTenant, admin: newAdmin });

      if (mongoose.connection && mongoose.connection.readyState === 1) {
        Tenant.create(newTenant).catch(() => {});
        RestaurantAdmin.create(newAdmin).catch(() => {});
        MenuItem.insertMany(defaultStarterMenuItems).catch(() => {});
      }
    } catch (err) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to add tenant' });
      }
    }
  },

  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const tenants = db.get('platformTenants') || [];
      let updated = null;

      const next = tenants.map((t) => {
        if (t.id === id || t.tenantId === id) {
          updated = { ...t, ...updates };
          return updated;
        }
        return t;
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      db.set('platformTenants', next);

      // Sync matching restaurantAdmin credentials if email or password updated
      const restaurantAdmins = db.get('restaurantAdmins') || [];
      const updatedAdmins = restaurantAdmins.map((adm) => {
        if (adm.restaurantId === id || adm.restaurantId === updated.id || adm.restaurantSlug === updated.slug) {
          return {
            ...adm,
            name: updated.ownerName || adm.name,
            email: updated.ownerEmail || adm.email,
            passwordHash: updated.ownerPassword ? hashPassword(updated.ownerPassword) : adm.passwordHash,
            passwordPlain: updated.ownerPassword || adm.passwordPlain,
            restaurantSlug: updated.slug || adm.restaurantSlug,
          };
        }
        return adm;
      });
      db.set('restaurantAdmins', updatedAdmins);

      res.status(200).json({ success: true, data: updated });

      if (mongoose.connection && mongoose.connection.readyState === 1) {
        Tenant.findOneAndUpdate({ $or: [{ tenantId: id }, { id }] }, updates).catch(() => {});
        if (updated.ownerPassword || updated.ownerEmail) {
          const admUpdates = {};
          if (updated.ownerEmail) admUpdates.email = updated.ownerEmail;
          if (updated.ownerPassword) {
            admUpdates.passwordHash = hashPassword(updated.ownerPassword);
            admUpdates.passwordPlain = updated.ownerPassword;
          }
          RestaurantAdmin.findOneAndUpdate({ restaurantId: id }, admUpdates).catch(() => {});
        }
      }
    } catch (err) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to update tenant' });
      }
    }
  },

  // Packaging Plans
  async getPlans(req, res) {
    try {
      const plans = db.get('pricingPlans');
      return res.status(200).json({ success: true, data: plans });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch plans' });
    }
  },

  async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const plans = db.get('pricingPlans');
      let updated = null;

      const next = plans.map((p) => {
        if (p.id === id) {
          updated = { ...p, ...updates };
          return updated;
        }
        return p;
      });

      db.set('pricingPlans', next);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update plan' });
    }
  },

  // Invoices & Revenue
  async getInvoices(req, res) {
    try {
      const invoices = db.get('invoices');
      return res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
  },

  async markInvoicePaid(req, res) {
    try {
      const { id } = req.params;
      const invoices = db.get('invoices');
      let updated = null;

      const next = invoices.map((inv) => {
        if (inv.id === id) {
          updated = { ...inv, status: 'PAID', paidAt: new Date().toISOString().split('T')[0] };
          return updated;
        }
        return inv;
      });

      db.set('invoices', next);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update invoice' });
    }
  },

  // SuperAdmin Profile Management with Immutable Protection
  async getSuperAdmins(req, res) {
    try {
      let superAdmins = [];
      try {
        superAdmins = await SuperAdmin.find({}, '-passwordHash');
      } catch (e) {
        superAdmins = (db.get('superAdmins') || []).map(({ passwordHash, ...rest }) => rest);
      }
      return res.status(200).json({ success: true, data: superAdmins });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch platform admins' });
    }
  },

  // Strictly protected: No user can delete or alter the hardcoded superadmin
  async deleteSuperAdmin(req, res) {
    try {
      const { email } = req.body;
      if (!email || email.toLowerCase() === 'progixtechnology@gmail.com') {
        return res.status(403).json({
          success: false,
          message: 'CRITICAL SECURITY: progixtechnology@gmail.com is hardcoded and locked. Deletion is forbidden.',
        });
      }

      await SuperAdmin.deleteOne({ email: email.toLowerCase() });
      return res.status(200).json({ success: true, message: 'SuperAdmin removed' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
