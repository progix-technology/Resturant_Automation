import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { RestaurantAdmin } from '../models/RestaurantAdmin.js';
import { Tenant } from '../models/Tenant.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Order } from '../models/Order.js';
import { MenuCategory } from '../models/MenuCategory.js';
import { PricingPlan } from '../models/PricingPlan.js';
import { Invoice } from '../models/Invoice.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { WaiterCall } from '../models/WaiterCall.js';
import { db } from '../data/db.js';

export const migrateAllDataToAtlas = async () => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      console.warn('⚠️ [MIGRATION] MongoDB Atlas not connected. Skipping migration.');
      return;
    }

    // Performance check: If Atlas is already populated, skip redundant migration on boot
    const existingItemsCount = await MenuItem.estimatedDocumentCount();
    if (existingItemsCount > 0) {
      console.log(`⚡ [MIGRATION SKIPPED] Atlas is already populated (${existingItemsCount} items). Booting instantly.`);
      return;
    }

    console.log('🚀 [MIGRATION] Starting full data migration from local db.json to MongoDB Atlas...');

    // 1. Migrate SuperAdmins
    const superAdmins = db.get('superAdmins') || [];
    for (const sa of superAdmins) {
      const email = sa.email.toLowerCase().trim();
      const existing = await SuperAdmin.findOne({ email });
      if (!existing) {
        await SuperAdmin.create({
          name: sa.name,
          email,
          passwordHash: sa.passwordHash || bcrypt.hashSync('Progix@123', 10),
          role: 'PLATFORM_SUPERADMIN',
          title: sa.title || 'Platform Founder',
          avatar: sa.avatar || '',
          company: sa.company || 'Progix Technology',
          isProtected: email === 'progixtechnology@gmail.com',
        });
      }
    }
    console.log('✅ [MIGRATION] SuperAdmin accounts verified in Atlas.');

    // 2. Migrate RestaurantAdmins
    const restaurantAdmins = db.get('restaurantAdmins') || [];
    for (const ra of restaurantAdmins) {
      const email = ra.email.toLowerCase().trim();
      const slug = (ra.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const existing = await RestaurantAdmin.findOne({ email });
      if (!existing) {
        await RestaurantAdmin.create({
          name: ra.name || 'Restaurant Admin',
          email,
          passwordHash: ra.passwordHash || bcrypt.hashSync('123123', 10),
          role: ra.role || 'ADMIN',
          title: ra.title || 'Head of Operations',
          avatar: ra.avatar || '',
          restaurantId: ra.restaurantId || `rest-${slug}`,
          restaurantSlug: slug,
        });
      }
    }
    console.log('✅ [MIGRATION] Restaurant Admin accounts verified in Atlas.');

    // 3. Migrate Platform Tenants
    const tenants = db.get('platformTenants') || [];
    for (const t of tenants) {
      const slug = (t.slug || 'spice-garden').toLowerCase().trim();
      const tenantId = t.id || t.tenantId || `tenant-${slug}`;
      const existing = await Tenant.findOne({ slug });
      if (!existing) {
        await Tenant.create({
          tenantId,
          name: t.name,
          slug,
          logo: t.logo || '🍽️',
          ownerName: t.ownerName || 'Owner',
          ownerEmail: t.ownerEmail || `${slug}@restaurant.com`,
          ownerPhone: t.ownerPhone || '',
          city: t.city || 'Bengaluru',
          planId: t.planId || 'plan-growth',
          planName: t.planName || 'Growth Pro',
          billingCycle: t.billingCycle || 'MONTHLY',
          planAmount: t.planAmount || 1499,
          status: t.status || 'ACTIVE',
          renewalDate: t.renewalDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          activeTables: t.activeTables || 15,
          monthlyOrders: t.monthlyOrders || 0,
          monthlyGMV: t.monthlyGMV || 0,
        });
      }
    }
    console.log('✅ [MIGRATION] Platform Tenants verified in Atlas.');

    // 4. Migrate Restaurant Settings
    const restaurants = db.get('restaurants') || [];
    for (const r of restaurants) {
      const slug = (r.slug || 'spice-garden').toLowerCase().trim();
      const existing = await RestaurantSettings.findOne({ slug });
      if (!existing) {
        await RestaurantSettings.create({
          slug,
          name: r.name,
          restaurantName: r.name,
          tagline: r.tagline || '',
          cuisine: r.cuisine || 'Multi-Cuisine',
          rating: 4.8,
          reviewCount: 320,
          address: r.address || '',
          phone: r.phone || '',
          email: r.email || '',
          gstin: r.gstNumber || r.gstin || '',
          currency: r.currency || 'INR',
          taxPercentage: r.taxPercentage || 5,
          isAcceptingOrders: r.isAcceptingOrders !== false,
          defaultPreparationTimeMinutes: r.defaultPrepTime || 25,
          upiId: r.upiId || `${slug}@upi`,
        });
      }
    }
    console.log('✅ [MIGRATION] Restaurant Settings verified in Atlas.');

    // 5. Migrate Menu Categories
    const categories = db.get('menuCategories') || [];
    for (const cat of categories) {
      const catId = cat.id || `cat-${cat.name.toLowerCase().replace(/\s+/g, '-')}`;
      const existing = await MenuCategory.findOne({ categoryId: catId, restaurantSlug: 'spice-garden' });
      if (!existing) {
        await MenuCategory.create({
          categoryId: catId,
          name: cat.name,
          sortOrder: cat.sortOrder || 1,
          icon: cat.icon || 'Utensils',
          restaurantSlug: 'spice-garden',
        });
      }
    }
    console.log('✅ [MIGRATION] Menu Categories verified in Atlas.');

    // 6. Migrate Menu Items
    const menuItems = db.get('menuItems') || [];
    for (const item of menuItems) {
      const itemId = item.id || item.itemId;
      const slug = (item.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const existing = await MenuItem.findOne({ itemId, restaurantSlug: slug });
      if (!existing) {
        await MenuItem.create({
          itemId,
          restaurantSlug: slug,
          name: item.name,
          category: item.category || 'Specialties',
          categoryId: item.categoryId || 'cat-starters',
          price: Number(item.price) || 0,
          description: item.description || '',
          image: item.image || '',
          isVeg: item.isVeg !== false,
          isSpicy: item.isSpicy || false,
          isPopular: item.isPopular || false,
          isRecommended: item.isRecommended || false,
          isAvailable: item.isAvailable !== false,
          preparationTime: typeof item.preparationTime === 'number' ? `${item.preparationTime} mins` : item.preparationTime || '15 mins',
          rating: item.rating || 4.8,
          addons: item.addons || [],
          variants: item.variants || [],
        });
      }
    }
    console.log('✅ [MIGRATION] Menu Items verified in Atlas.');

    // 7. Migrate & Patch Tables (Adding restaurantSlug to existing tables)
    // First, update any existing tables in Atlas without restaurantSlug to 'spice-garden'
    await Table.updateMany(
      { restaurantSlug: { $exists: false } },
      { $set: { restaurantSlug: 'spice-garden' } }
    );

    const tables = db.get('tables') || [];
    for (const tbl of tables) {
      const slug = (tbl.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const numStr = String(tbl.number || tbl.id).padStart(2, '0');
      const tableId = tbl.id || tbl.tableId || `tbl-${slug}-${numStr}`;
      const existing = await Table.findOne({ restaurantSlug: slug, number: numStr });
      if (!existing) {
        await Table.create({
          tableId,
          restaurantSlug: slug,
          number: numStr,
          capacity: tbl.capacity || 4,
          status: tbl.status || 'AVAILABLE',
          section: tbl.section || 'Main Dining',
          currentOrderId: tbl.currentOrderId || null,
          customerName: tbl.customerName || null,
          amount: tbl.amount || 0,
          occupiedSince: tbl.occupiedSince || null,
        });
      }
    }
    console.log('✅ [MIGRATION] Tables verified with restaurant isolation in Atlas.');

    // 8. Migrate Pricing Plans
    const plans = db.get('pricingPlans') || [];
    for (const p of plans) {
      const planId = p.id;
      const existing = await PricingPlan.findOne({ id: planId });
      if (!existing) {
        await PricingPlan.create({
          planId,
          id: planId,
          name: p.name,
          badge: p.badge || '',
          monthlyPrice: p.monthlyPrice || 999,
          annualPrice: p.annualPrice || 9999,
          tableLimit: p.tableLimit || 20,
          description: p.description || '',
          features: p.features || [],
          isPopular: p.isPopular || false,
          color: p.color || 'amber',
        });
      }
    }
    console.log('✅ [MIGRATION] Pricing Plans verified in Atlas.');

    // 9. Migrate Invoices
    const invoices = db.get('invoices') || [];
    for (const inv of invoices) {
      const invoiceId = inv.id || inv.invoiceId;
      const existing = await Invoice.findOne({ id: invoiceId });
      if (!existing) {
        await Invoice.create({
          invoiceId,
          id: invoiceId,
          tenantId: inv.tenantId || `tenant-${inv.slug || '01'}`,
          tenantName: inv.tenantName || inv.restaurantName || inv.name || 'Restaurant Client',
          slug: inv.slug || 'spice-garden',
          planName: inv.planName || 'Growth Pro',
          amount: inv.amount || 1499,
          status: inv.status || 'PAID',
          billingDate: inv.billingDate || new Date().toISOString().split('T')[0],
          dueDate: inv.dueDate || new Date().toISOString().split('T')[0],
          paidAt: inv.paidAt ? new Date(inv.paidAt) : null,
          paymentMethod: inv.paymentMethod || 'UPI / Bank Transfer',
        });
      }
    }
    console.log('✅ [MIGRATION] Invoices verified in Atlas.');

    // 10. Migrate Platform Settings
    const platformSettings = db.get('platformSettings') || {};
    const existingPlatformSettings = await PlatformSettings.findOne();
    if (!existingPlatformSettings) {
      await PlatformSettings.create({
        companyName: platformSettings.companyName || 'Progix Technology Pvt Ltd',
        brandName: platformSettings.brandName || 'OrderFlow Multi-Tenant Cloud',
        contactEmail: platformSettings.contactEmail || 'progixtechnology@gmail.com',
        supportPhone: platformSettings.supportPhone || '+91 98765 43210',
        upiId: platformSettings.upiId || 'progixtechnology@upi',
        bankName: platformSettings.bankName || 'HDFC Bank',
        accountNumber: platformSettings.accountNumber || '50200012345678',
        ifscCode: platformSettings.ifscCode || 'HDFC0001234',
        accountHolder: platformSettings.accountHolder || 'Progix Technology Pvt Ltd',
        qrImageUrl: platformSettings.qrImageUrl || '',
        taxPercentage: platformSettings.taxPercentage || 18,
      });
      console.log('✅ [MIGRATION] Platform Settings initialized in Atlas.');
    }

    console.log('🎉 [MIGRATION] All data successfully migrated & synchronized into MongoDB Atlas! Single source of truth active.');
  } catch (err) {
    console.error('❌ [MIGRATION] Migration error:', err);
  }
};
