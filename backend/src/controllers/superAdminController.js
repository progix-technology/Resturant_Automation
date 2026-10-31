import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant.js';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { RestaurantAdmin } from '../models/RestaurantAdmin.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { PricingPlan } from '../models/PricingPlan.js';
import { Invoice } from '../models/Invoice.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { hashPassword } from '../utils/passwordUtils.js';

export const superAdminController = {
  // ==========================================
  // TENANTS MANAGEMENT (MongoDB Atlas Authoritative)
  // ==========================================
  async getTenants(req, res) {
    try {
      const tenants = await Tenant.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({
        success: true,
        count: tenants.length,
        data: tenants.map((t) => ({ ...t, id: t.tenantId || t._id.toString() })),
      });
    } catch (err) {
      console.error('getTenants error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch tenants' });
    }
  },

  async addTenant(req, res) {
    try {
      const tenantData = req.body;
      const tenantId = `tenant-${Date.now().toString().slice(-6)}`;
      const slug = (tenantData.slug || `rest-${Date.now().toString().slice(-4)}`).toLowerCase().trim().replace(/_/g, '-');

      const ownerEmail = tenantData.ownerEmail && tenantData.ownerEmail.includes('@')
        ? tenantData.ownerEmail.trim().toLowerCase()
        : `${slug}@restaurant.com`;
      const ownerPassword = tenantData.ownerPassword || 'Admin@123';

      const newTenant = await Tenant.create({
        tenantId,
        id: tenantId,
        name: tenantData.name,
        slug,
        logo: tenantData.logo || '🍽️',
        ownerName: tenantData.ownerName || tenantData.name,
        ownerEmail,
        ownerPassword,
        ownerPhone: tenantData.ownerPhone || '',
        city: tenantData.city || 'Lucknow',
        planId: tenantData.planId || 'plan-growth',
        planName: tenantData.planName || 'Growth Pro',
        billingCycle: tenantData.billingCycle || 'MONTHLY',
        planAmount: Number(tenantData.planAmount) || 1499,
        status: tenantData.status || 'ACTIVE',
        activeTables: Number(tenantData.activeTables) || 15,
        monthlyOrders: 0,
        monthlyGMV: 0,
        renewalDate: tenantData.renewalDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      });

      // Auto-create Restaurant Admin account in MongoDB Atlas
      const adminId = `adm-${Date.now().toString().slice(-6)}`;
      const newAdmin = await RestaurantAdmin.create({
        id: adminId,
        name: tenantData.ownerName || tenantData.name,
        email: ownerEmail,
        passwordHash: hashPassword(ownerPassword),
        role: 'ADMIN',
        title: 'Restaurant Owner & Admin',
        restaurantId: tenantId,
        restaurantSlug: slug,
      });

      // Auto-create Restaurant Settings in MongoDB Atlas
      await RestaurantSettings.findOneAndUpdate(
        { slug },
        {
          slug,
          name: tenantData.name,
          restaurantName: tenantData.name,
          tagline: 'Fresh Flavours & Quality Dining',
          cuisine: 'Multi-Cuisine',
          rating: 4.8,
          reviewCount: 50,
          address: tenantData.address || tenantData.city || 'Bengaluru',
          phone: tenantData.ownerPhone || '',
          email: ownerEmail,
          isAcceptingOrders: true,
          planId: newTenant.planId,
          planName: newTenant.planName,
        },
        { upsert: true, new: true }
      );

      // Auto-create 10 starter tables for this restaurant in MongoDB Atlas
      const starterTables = Array.from({ length: 10 }, (_, idx) => {
        const numStr = String(idx + 1).padStart(2, '0');
        return {
          tableId: `tbl-${slug}-${numStr}`,
          restaurantSlug: slug,
          number: numStr,
          capacity: 4,
          section: 'Main Dining',
          status: 'AVAILABLE',
        };
      });
      await Table.insertMany(starterTables).catch(() => { });

      // Auto-seed starter menu items for this restaurant in MongoDB Atlas
      const starterMenuItems = [
        {
          itemId: `item-${slug}-101`,
          restaurantSlug: slug,
          name: 'Crispy Corn Chilli Pepper',
          category: 'Starters & Appetizers',
          price: 240,
          description: 'Golden sweet corn kernels tossed with crunchy bell peppers, spring onion, and crushed black pepper.',
          image: '',
          isVeg: true,
          isSpicy: true,
          isPopular: true,
          isAvailable: true,
          preparationTime: '15 mins',
        },
        {
          itemId: `item-${slug}-201`,
          restaurantSlug: slug,
          name: 'Paneer Butter Masala',
          category: 'Main Course Specialties',
          price: 340,
          description: 'Succulent malai paneer simmered in a velvety, rich tomato cashew butter gravy.',
          image: '',
          isVeg: true,
          isSpicy: false,
          isPopular: true,
          isAvailable: true,
          preparationTime: '20 mins',
        },
        {
          itemId: `item-${slug}-301`,
          restaurantSlug: slug,
          name: 'Butter Garlic Naan',
          category: 'Breads & Rice',
          price: 75,
          description: 'Tandoor-baked leavened flatbread topped with roasted garlic flakes and melted salted butter.',
          image: '',
          isVeg: true,
          isSpicy: false,
          isPopular: true,
          isAvailable: true,
          preparationTime: '10 mins',
        },
      ];
      await MenuItem.insertMany(starterMenuItems).catch(() => { });

      return res.status(201).json({
        success: true,
        message: `Restaurant "${newTenant.name}" onboarded successfully`,
        data: {
          ...newTenant.toObject(),
          id: newTenant.tenantId,
        },
        admin: {
          email: newAdmin.email,
          temporaryPassword: ownerPassword,
        },
      });
    } catch (err) {
      console.error('addTenant error:', err);
      return res.status(500).json({ success: false, message: 'Failed to add tenant to database' });
    }
  },

  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await Tenant.findOneAndUpdate(
        { $or: [{ tenantId: id }, { slug: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
        updates,
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      // Sync Admin credentials if password or email updated
      if (updates.ownerPassword || updates.ownerEmail) {
        await RestaurantAdmin.findOneAndUpdate(
          { restaurantSlug: updated.slug },
          {
            ...(updates.ownerEmail ? { email: updates.ownerEmail.toLowerCase().trim() } : {}),
            ...(updates.ownerPassword ? { passwordHash: hashPassword(updates.ownerPassword) } : {}),
          }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Tenant updated successfully',
        data: {
          ...updated,
          id: updated.tenantId,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update tenant' });
    }
  },

  async deleteTenant(req, res) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findOne({
        $or: [{ tenantId: id }, { slug: id }, { _id: mongoose.isValidObjectId(id) ? id : null }],
      });

      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      const slug = tenant.slug;

      // Delete tenant and associated isolated resources from MongoDB Atlas
      await Tenant.deleteOne({ _id: tenant._id });
      await RestaurantAdmin.deleteMany({ restaurantSlug: slug });
      await RestaurantSettings.deleteMany({ slug });
      await MenuItem.deleteMany({ restaurantSlug: slug });
      await Table.deleteMany({ restaurantSlug: slug });

      return res.status(200).json({
        success: true,
        message: `Tenant "${tenant.name}" and associated resources deleted successfully`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete tenant' });
    }
  },

  // ==========================================
  // PRICING PLANS (MongoDB Atlas Authoritative)
  // ==========================================
  async getPlans(req, res) {
    try {
      const plans = await PricingPlan.find().lean();
      return res.status(200).json({
        success: true,
        data: plans.map((p) => ({ ...p, id: p.planId || p.id })),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch plans' });
    }
  },

  async addPlan(req, res) {
    try {
      const planData = req.body;
      const planId = planData.id || `plan-${Date.now().toString(36)}`;

      const created = await PricingPlan.create({
        ...planData,
        planId,
        id: planId,
      });

      return res.status(201).json({
        success: true,
        message: 'Pricing plan created',
        data: {
          ...created.toObject(),
          id: created.planId,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to add plan' });
    }
  },

  async updatePlan(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await PricingPlan.findOneAndUpdate(
        { $or: [{ planId: id }, { id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
        updates,
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Plan not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...updated,
          id: updated.planId || updated.id,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update plan' });
    }
  },

  // ==========================================
  // INVOICES & BILLING (MongoDB Atlas Authoritative)
  // ==========================================
  async getInvoices(req, res) {
    try {
      const invoices = await Invoice.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({
        success: true,
        data: invoices.map((inv) => ({ ...inv, id: inv.invoiceId || inv.id })),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
  },

  async addInvoice(req, res) {
    try {
      const invData = req.body;
      const invoiceId = invData.id || `INV-${Date.now().toString().slice(-6)}`;

      const created = await Invoice.create({
        ...invData,
        invoiceId,
        id: invoiceId,
        status: invData.status || 'PENDING',
        billingDate: invData.billingDate || new Date().toISOString().split('T')[0],
        dueDate: invData.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      });

      return res.status(201).json({
        success: true,
        data: {
          ...created.toObject(),
          id: created.invoiceId,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to create invoice' });
    }
  },

  async markInvoicePaid(req, res) {
    try {
      const { id } = req.params;

      const updated = await Invoice.findOneAndUpdate(
        { $or: [{ invoiceId: id }, { id }, { _id: mongoose.isValidObjectId(id) ? id : null }] },
        {
          status: 'PAID',
          paidAt: new Date(),
        },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      // Also mark matching tenant active
      if (updated.tenantId || updated.slug) {
        await Tenant.findOneAndUpdate(
          { $or: [{ tenantId: updated.tenantId }, { slug: updated.slug }] },
          { status: 'ACTIVE' }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Invoice marked as PAID',
        data: {
          ...updated,
          id: updated.invoiceId || updated.id,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update invoice' });
    }
  },

  // ==========================================
  // PLATFORM SETTINGS (MongoDB Atlas Authoritative)
  // ==========================================
  async getSettings(req, res) {
    try {
      let settings = await PlatformSettings.findOne().lean();
      if (!settings) {
        settings = await PlatformSettings.create({});
      }
      return res.status(200).json({ success: true, data: settings });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  },

  async updateSettings(req, res) {
    try {
      const updates = req.body;
      const updated = await PlatformSettings.findOneAndUpdate({}, updates, { new: true, upsert: true }).lean();
      return res.status(200).json({
        success: true,
        message: 'Platform settings updated successfully',
        data: updated,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  },

  // ==========================================
  // SUPERADMINS MANAGEMENT
  // ==========================================
  async getSuperAdmins(req, res) {
    try {
      const superAdmins = await SuperAdmin.find({}, { passwordHash: 0 }).lean();
      return res.status(200).json({
        success: true,
        data: superAdmins.map((sa) => ({ ...sa, id: sa._id.toString() })),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch platform admins' });
    }
  },

  async deleteSuperAdmin(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      if (email.toLowerCase().trim() === 'progixtechnology@gmail.com') {
        return res.status(403).json({ success: false, message: 'The primary owner account is protected and cannot be deleted.' });
      }

      await SuperAdmin.deleteOne({ email: email.toLowerCase().trim() });
      return res.status(200).json({ success: true, message: 'Platform admin removed successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete superadmin' });
    }
  },
};
