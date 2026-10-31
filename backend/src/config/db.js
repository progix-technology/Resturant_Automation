import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { SuperAdmin } from '../models/SuperAdmin.js';
import { RestaurantAdmin } from '../models/RestaurantAdmin.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { Order } from '../models/Order.js';
import { Tenant } from '../models/Tenant.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { migrateAllDataToAtlas } from './migrateToAtlas.js';

mongoose.set('autoIndex', false);
mongoose.set('bufferCommands', false);

export let lastDbError = null;

export const connectMongoDB = async () => {
  const uri = (process.env.MONGODB_URI || '').trim();

  if (!uri || !uri.startsWith('mongodb') || uri.includes('localhost') || uri.includes('127.0.0.1')) {
    console.log('ℹ️ MONGODB_URI not provided or local. Operating with resilient in-memory / JSON store.');
    return;
  }

  try {
    const masked = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔄 Connecting to MongoDB Atlas (${masked})...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    lastDbError = null;

    // Run Initial Seed & Protection verification
    await seedAndProtectDatabase();

    // Run full migration of all data from local stores to MongoDB Atlas
    await migrateAllDataToAtlas();
  } catch (error) {
    lastDbError = error.message;
    console.error('❌ MongoDB Atlas connection warning:', error.message);
    console.log('ℹ️ Server will continue operating with resilient in-memory store fallback.');
  }
};

/**
 * Seeds and hardcodes protected credentials into MongoDB Atlas
 */
export const seedAndProtectDatabase = async () => {
  try {
    console.log('🔒 Verifying and seeding protected accounts in MongoDB Atlas...');

    // 1. HARDCODED & PROTECTED SUPERADMIN (progixtechnology@gmail.com)
    const superAdminEmail = process.env.SUPERADMIN_DEFAULT_EMAIL || 'progixtechnology@gmail.com';
    let superAdmin = await SuperAdmin.findOne({ email: superAdminEmail });

    const defaultSuperPass = process.env.SUPERADMIN_DEFAULT_PASSWORD || 'Progix@123';
    const superAdminHash = bcrypt.hashSync(defaultSuperPass, 10);

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
      console.log('🛡️ Platform SuperAdmin account created & protected in MongoDB Atlas.');
    } else {
      // Ensure it is always locked & protected without overwriting user's updated password
      superAdmin.isProtected = true;
      superAdmin.role = 'PLATFORM_SUPERADMIN';
      if (!superAdmin.passwordHash) {
        superAdmin.passwordHash = superAdminHash;
      }
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
      if (!restAdmin1.passwordHash) {
        restAdmin1.passwordHash = rest1Hash;
      }
      restAdmin1.role = 'ADMIN';
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

    console.log('✨ MongoDB Atlas protected accounts verified successfully!');
  } catch (seedErr) {
    console.error('Seeding error:', seedErr);
  }
};

