import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { RestaurantAdmin } from '../models/RestaurantAdmin.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Order } from '../models/Order.js';
import { Tenant } from '../models/Tenant.js';
import { db } from '../data/db.js';

mongoose.set('autoIndex', false);

export const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ MONGODB_URI not provided. Running in standalone local JSON mode.');
    return;
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);

    // Run Initial Seed & Protection verification
    await seedAndProtectDatabase();
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    console.log('ℹ️ Server will continue operating with resilient in-memory / JSON store fallback.');
  }
};

import { RestaurantSettings } from '../models/RestaurantSettings.js';

/**
 * Seeds and hardcodes protected credentials into MongoDB Atlas
 */
export const seedAndProtectDatabase = async () => {
  try {
    console.log('🔒 Verifying and seeding protected accounts in MongoDB Atlas...');

    // 1. HARDCODED & PROTECTED SUPERADMIN (progixtechnology@gmail.com / Progix@123)
    const superAdminEmail = 'progixtechnology@gmail.com';
    let superAdmin = await SuperAdmin.findOne({ email: superAdminEmail });

    const superAdminHash = bcrypt.hashSync('Progix@123', 10);

    if (!superAdmin) {
      await SuperAdmin.create({
        name: 'Progix Technology',
        email: superAdminEmail,
        passwordHash: superAdminHash,
        role: 'PLATFORM_SUPERADMIN',
        title: 'Platform Founder & Owner',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        company: 'Progix Technology Pvt Ltd',
        isProtected: true,
      });
      console.log('🛡️ Platform SuperAdmin account created & hardcoded in MongoDB Atlas.');
    } else {
      // Ensure it is always locked & protected
      superAdmin.isProtected = true;
      superAdmin.role = 'PLATFORM_SUPERADMIN';
      superAdmin.passwordHash = superAdminHash; // Ensure correct hashed password
      await superAdmin.save();
      console.log('🛡️ Platform SuperAdmin account verified & locked as immutable in MongoDB Atlas.');
    }

    // Also ensure secondary platform admin if needed
    const ownerEmail = 'owner@orderflow.io';
    const ownerExists = await SuperAdmin.findOne({ email: ownerEmail });
    if (!ownerExists) {
      await SuperAdmin.create({
        name: 'Alexander Vance',
        email: ownerEmail,
        passwordHash: bcrypt.hashSync('SuperAdmin@123', 10),
        role: 'PLATFORM_SUPERADMIN',
        title: 'Platform Co-Founder',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
        company: 'OrderFlow HQ',
        isProtected: false,
      });
    }

    // 2. RESTAURANT ADMIN (resturant1@gmail.com / 123123)
    const rest1Email = 'resturant1@gmail.com';
    let restAdmin1 = await RestaurantAdmin.findOne({ email: rest1Email });
    const rest1Hash = bcrypt.hashSync('123123', 10);

    if (!restAdmin1) {
      await RestaurantAdmin.create({
        name: 'Restaurant 1 Manager',
        email: rest1Email,
        passwordHash: rest1Hash,
        role: 'ADMIN',
        title: 'Head of Operations',
        avatar: '',
        restaurantId: 'rest-001',
        restaurantSlug: 'spice-garden',
      });
      console.log('🍽️ Restaurant Admin account created in MongoDB Atlas.');
    } else {
      restAdmin1.passwordHash = rest1Hash;
      restAdmin1.role = 'ADMIN';
      restAdmin1.avatar = '';
      await restAdmin1.save();
      console.log('🍽️ Restaurant Admin account verified & synchronized in MongoDB Atlas.');
    }

    // Staff admin
    const staffEmail = 'admin@restaurant.com';
    const staffExists = await RestaurantAdmin.findOne({ email: staffEmail });
    if (!staffExists) {
      await RestaurantAdmin.create({
        name: 'Vikram Malhotra',
        email: staffEmail,
        passwordHash: bcrypt.hashSync('Admin@123', 10),
        role: 'SUPER_ADMIN',
        title: 'General Manager',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        restaurantId: 'rest-001',
        restaurantSlug: 'spice-garden',
      });
    }

    // 3. Seed initial Menu Items to MongoDB Atlas (ONLY if item does not exist)
    const items = db.get('menuItems');
    if (items && items.length > 0) {
      const operations = items.map((i) => ({
        updateOne: {
          filter: { itemId: i.id || i.itemId },
          update: {
            $setOnInsert: {
              itemId: i.id || i.itemId,
              restaurantSlug: i.restaurantSlug || 'spice-garden',
              name: i.name,
              category: i.category || i.categoryId || 'Specialties',
              categoryId: i.categoryId || 'starters',
              price: Number(i.price) || 0,
              description: i.description || '',
              image: i.image || '',
              isVeg: i.isVeg !== false,
              isSpicy: i.isSpicy || false,
              isPopular: i.isPopular || false,
              isAvailable: i.isAvailable !== false,
              preparationTime: typeof i.preparationTime === 'number' ? i.preparationTime : parseInt(String(i.preparationTime || 15).replace(/\D/g, '')) || 15,
            },
          },
          upsert: true,
        },
      }));
      await MenuItem.bulkWrite(operations);
      console.log(`📋 Verified ${items.length} starter Menu Items in MongoDB Atlas.`);
    }

    // 4. Seed Tables (ONLY if table does not exist)
    const tables = db.get('tables');
    if (tables && tables.length > 0) {
      const tableOps = tables.map((t) => ({
        updateOne: {
          filter: { tableId: t.id },
          update: {
            $setOnInsert: {
              tableId: t.id,
              number: t.number,
              capacity: t.capacity,
              status: t.status || 'AVAILABLE',
              section: t.section || 'Main Dining',
              currentOrderId: t.currentOrderId || null,
              customerName: t.customerName || null,
              amount: t.amount || 0,
              occupiedSince: t.occupiedSince || null,
            },
          },
          upsert: true,
        },
      }));
      await Table.bulkWrite(tableOps);
      console.log(`🪑 Verified ${tables.length} Tables in MongoDB Atlas.`);
    }

    // 5. Seed Tenants (ONLY if tenant does not exist)
    const tenants = db.get('platformTenants');
    if (tenants && tenants.length > 0) {
      const tenantOps = tenants.map((t) => ({
        updateOne: {
          filter: { tenantId: t.id },
          update: {
            $setOnInsert: {
              tenantId: t.id,
              name: t.name,
              slug: t.slug,
              logo: t.logo,
              ownerName: t.ownerName,
              ownerEmail: t.ownerEmail,
              ownerPhone: t.ownerPhone,
              city: t.city,
              planId: t.planId,
              planName: t.planName,
              billingCycle: t.billingCycle,
              planAmount: t.planAmount,
              status: t.status,
              renewalDate: t.renewalDate,
              activeTables: t.activeTables,
              monthlyOrders: t.monthlyOrders,
              monthlyGMV: t.monthlyGMV,
            },
          },
          upsert: true,
        },
      }));
      await Tenant.bulkWrite(tenantOps);
      console.log(`🏢 Verified ${tenants.length} Tenants in MongoDB Atlas.`);
    }

    // 6. Seed Orders (ONLY if order does not exist)
    const orders = db.get('orders');
    if (orders && orders.length > 0) {
      const orderOps = orders.map((o) => ({
        updateOne: {
          filter: { orderId: o.orderId || o.id },
          update: {
            $setOnInsert: {
              orderId: o.orderId || o.id,
              restaurantSlug: o.restaurantSlug || 'spice-garden',
              customerName: o.customerName,
              mobile: o.mobile || '',
              tableNumber: o.tableNumber,
              items: o.items || [],
              subtotal: o.subtotal || 0,
              taxes: o.taxes || 0,
              total: o.total || 0,
              orderStatus: o.orderStatus || 'PENDING',
              paymentStatus: o.paymentStatus || 'PENDING',
              paymentMethod: o.paymentMethod || 'UPI',
              etaMinutes: o.etaMinutes || 20,
            },
          },
          upsert: true,
        },
      }));
      await Order.bulkWrite(orderOps);
      console.log(`🧾 Verified ${orders.length} Sample Orders in MongoDB Atlas.`);
    }

    // 7. Seed Restaurant Settings (ONLY if settings do NOT exist in MongoDB Atlas)
    const restaurants = db.get('restaurants');
    if (restaurants && restaurants.length > 0) {
      for (const r of restaurants) {
        const existingSetting = await RestaurantSettings.findOne({ slug: r.slug });
        if (!existingSetting) {
          await RestaurantSettings.create({
            slug: r.slug,
            name: r.name,
            restaurantName: r.name,
            tagline: r.tagline || 'Authentic Indian Flavours',
            city: r.city || 'Bengaluru',
            address: r.address || '',
            phone: r.phone || '',
            email: r.email || '',
            gstin: r.gstNumber || r.gstin || '',
            currency: r.currency || 'INR',
            taxPercentage: r.taxPercentage || 5,
            isAcceptingOrders: r.isAcceptingOrders !== false,
            defaultPreparationTimeMinutes: r.defaultPrepTime || 25,
            upiId: r.upiId || 'spicegarden@okhdfcbank',
          });
        }
      }
      console.log(`⚙️ Verified Restaurant Settings in MongoDB Atlas (Existing user edits preserved).`);
    }

    console.log('✨ MongoDB Atlas initialization & seeding completed successfully!');
  } catch (seedErr) {
    console.error('Seeding error:', seedErr);
  }
};

