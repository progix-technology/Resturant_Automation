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
          const mongoTenants = await Tenant.find().sort({ createdAt: -1 }).lean();

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

      // Sync matching restaurantSettings if plan details updated
      if (updates.planId || updates.planName) {
        const settingsList = db.get('restaurantSettings') || [];
        const targetSlug = updated.slug || updated.id;
        const updatedSettingsList = settingsList.map((s) => {
          if (s.restaurantSlug === targetSlug || s.slug === targetSlug || (s.restaurantSlug && targetSlug.includes(s.restaurantSlug))) {
            return {
              ...s,
              planId: updates.planId || s.planId,
              planName: updates.planName || s.planName,
            };
          }
          return s;
        });
        db.set('restaurantSettings', updatedSettingsList);
      }

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

  async deleteTenant(req, res) {
    try {
      const { id } = req.params;
      const tenants = db.get('platformTenants') || [];
      const filtered = tenants.filter((t) => t.id !== id && t.tenantId !== id);
      db.set('platformTenants', filtered);

      if (mongoose.connection && mongoose.connection.readyState === 1) {
        Tenant.deleteOne({ $or: [{ id }, { tenantId: id }] }).catch(() => {});
      }

      return res.status(200).json({ success: true, message: 'Tenant deleted successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete tenant' });
    }
  },

  // Packaging Plans
  async getPlans(req, res) {
    try {
      const plans = db.get('pricingPlans') || [];
      return res.status(200).json({ success: true, data: plans });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch plans' });
    }
  },

  async addPlan(req, res) {
    try {
      const planData = req.body;
      const plans = db.get('pricingPlans') || [];
      const newPlan = {
        ...planData,
        id: planData.id || `plan-${Date.now().toString().slice(-4)}`,
        activeSubscribers: 0,
        monthlyPrice: Number(planData.monthlyPrice) || 999,
        annualPrice: Number(planData.annualPrice) || 9990,
        maxTables: Number(planData.maxTables) || 10,
        maxDishes: Number(planData.maxDishes) || 30,
        maxAdminLogins: Number(planData.maxAdminLogins) || 1,
        maxStaffAccounts: Number(planData.maxStaffAccounts || planData.staffAccounts) || 0,
        analyticsEnabled: Boolean(planData.analyticsEnabled),
        features: Array.isArray(planData.features) ? planData.features : (planData.features || '').split('\n').filter(Boolean),
      };

      db.set('pricingPlans', [...plans, newPlan]);
      return res.status(201).json({ success: true, data: newPlan });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to add plan' });
    }
  },

  async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const plans = db.get('pricingPlans') || [];
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
      const invoices = db.get('invoices') || [];
      return res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
  },

  async addInvoice(req, res) {
    try {
      const invData = req.body;
      const invoices = db.get('invoices') || [];
      const newInvoice = {
        id: invData.id || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        ...invData,
        issuedDate: invData.issuedDate || new Date().toISOString().split('T')[0],
        dueDate: invData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      };
      db.set('invoices', [newInvoice, ...invoices]);
      return res.status(201).json({ success: true, data: newInvoice });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to add invoice' });
    }
  },

  async markInvoicePaid(req, res) {
    try {
      const { id } = req.params;
      const invoices = db.get('invoices') || [];
      let updated = null;

      const next = invoices.map((inv) => {
        if (inv.id === id) {
          updated = { ...inv, status: 'PAID', paidAt: new Date().toISOString().split('T')[0] };
          return updated;
        }
        return inv;
      });

      if (updated && updated.tenantId) {
        const tenants = db.get('platformTenants') || [];
        const isAnnual = String(updated.cycle || '').toLowerCase().includes('annual');
        const daysToAdd = isAnnual ? 365 : 30;
        const newRenewalDate = new Date(Date.now() + daysToAdd * 86400000).toISOString().split('T')[0];

        const nextTenants = tenants.map((t) => {
          if (t.id === updated.tenantId || t.tenantId === updated.tenantId) {
            return {
              ...t,
              planId: updated.requestedPlanId || t.planId,
              planName: updated.requestedPlanName || updated.planName || t.planName,
              status: 'ACTIVE',
              renewalDate: newRenewalDate,
            };
          }
          return t;
        });
        db.set('platformTenants', nextTenants);
      }

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

  // Platform Settings (UPI ID, QR Code image URL, Bank Account details, GSTIN)
  async getSettings(req, res) {
    try {
      const settings = db.get('platformSettings') || {
        platformName: 'OrderFlow SaaS Engine',
        companyLegalName: 'Progix Technology Pvt Ltd',
        taxId: '29AAFCO1234F1Z8',
        supportEmail: 'progixtechnology@gmail.com',
        supportPhone: '+91 98765 43210',
        upiId: 'progixtechnology@upi',
        upiQrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=progixtechnology@upi%26pn=Progix%20SaaS',
        bankName: 'HDFC Bank',
        accountHolder: 'Progix Technology Pvt Ltd',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
      };
      return res.status(200).json({ success: true, data: settings });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  },

  async updateSettings(req, res) {
    try {
      const updates = req.body;
      const current = db.get('platformSettings') || {};
      const next = { ...current, ...updates };
      db.set('platformSettings', next);
      return res.status(200).json({ success: true, data: next });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update settings' });
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
