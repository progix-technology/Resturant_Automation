import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { RestaurantAdmin } from '../models/RestaurantAdmin.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Order } from '../models/Order.js';
import { Tenant } from '../models/Tenant.js';
import { db } from '../data/db.js';

mongoose.set('bufferCommands', false);
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
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);

    // Run Initial Seed & Protection verification
    await seedAndProtectDatabase();
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    console.log('ℹ️ Server will continue operating with resilient in-memory / JSON store fallback.');
  }
};

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

    // 3. Seed Menu Items if empty
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      const items = db.get('menuItems');
      if (items && items.length > 0) {
        await MenuItem.insertMany(
          items.map((i) => ({
            itemId: i.id,
            restaurantSlug: i.restaurantSlug || 'spice-garden',
            name: i.name,
            category: i.category,
            price: i.price,
            description: i.description,
            image: i.image,
            isVeg: i.isVeg,
            isSpicy: i.isSpicy,
            isPopular: i.isPopular,
            isAvailable: i.isAvailable,
            preparationTime: i.preparationTime || 15,
          }))
        );
        console.log(`📋 Seeded ${items.length} Menu Items to MongoDB Atlas.`);
      }
    }

    // 4. Seed Tables if empty
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const tables = db.get('tables');
      if (tables && tables.length > 0) {
        await Table.insertMany(
          tables.map((t) => ({
            tableId: t.id,
            number: t.number,
            capacity: t.capacity,
            status: t.status,
            section: t.section,
            currentOrderId: t.currentOrderId,
            customerName: t.customerName,
            amount: t.amount,
            occupiedSince: t.occupiedSince,
          }))
        );
        console.log(`🪑 Seeded ${tables.length} Tables to MongoDB Atlas.`);
      }
    }

    // 5. Seed Tenants if empty
    const tenantCount = await Tenant.countDocuments();
    if (tenantCount === 0) {
      const tenants = db.get('platformTenants');
      if (tenants && tenants.length > 0) {
        await Tenant.insertMany(
          tenants.map((t) => ({
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
          }))
        );
        console.log(`🏢 Seeded ${tenants.length} Tenants to MongoDB Atlas.`);
      }
    }

    // 6. Seed Orders if empty
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      const orders = db.get('orders');
      if (orders && orders.length > 0) {
        await Order.insertMany(
          orders.map((o) => ({
            orderId: o.orderId || o.id,
            restaurantSlug: o.restaurantSlug || 'spice-garden',
            customerName: o.customerName,
            mobile: o.mobile || '',
            tableNumber: o.tableNumber,
            items: o.items,
            subtotal: o.subtotal,
            taxes: o.taxes,
            total: o.total,
            orderStatus: o.orderStatus,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            etaMinutes: o.etaMinutes || 20,
          }))
        );
        console.log(`🧾 Seeded ${orders.length} Sample Orders to MongoDB Atlas.`);
      }
    }

    console.log('✨ MongoDB Atlas initialization & seeding completed successfully!');
  } catch (seedErr) {
    console.error('Seeding error:', seedErr);
  }
};
