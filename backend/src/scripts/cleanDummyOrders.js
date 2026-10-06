import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../data/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cleanDummyOrders = async () => {
  try {
    // 1. Clean local database FIRST
    const localOrders = db.get('orders') || [];
    const realOrders = localOrders.filter((o) => {
      const isDummy =
        ['ORD-1526', 'ORD-8021', 'ORD-1041', 'ORD-1042'].includes(o.orderId) ||
        /test|sample/i.test(o.customerName || '') ||
        o.customerName === 'Rohan Sharma' ||
        o.customerName === 'Test Customer';
      return !isDummy;
    });

    db.set('orders', realOrders);
    console.log(`📦 Local orders updated: ${realOrders.length} real orders retained.`);
    realOrders.forEach(o => console.log(`  -> Kept Real Order: #${o.orderId} - ${o.customerName} (Table ${o.tableNumber}, ₹${o.total})`));

    // Reset Table 02 in local tables to AVAILABLE
    const tables = db.get('tables') || [];
    const updatedTables = tables.map((t) => {
      if (t.number === '02') {
        return {
          ...t,
          status: 'AVAILABLE',
          currentOrderId: null,
          customerName: null,
          amount: 0,
          occupiedSince: null,
        };
      }
      return t;
    });
    db.set('tables', updatedTables);
    console.log('🪑 Local tables updated (Table 02 set to AVAILABLE).');

    // 2. Try Atlas if reachable, but non-blocking
    const uri = process.env.MONGODB_URI;
    if (uri) {
      try {
        console.log('🔄 Attempting MongoDB Atlas cleanup (3s timeout)...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        const { Order } = await import('../models/Order.js');
        const { Table } = await import('../models/Table.js');

        const deleteResult = await Order.deleteMany({
          $or: [
            { orderId: { $in: ['ORD-1526', 'ORD-8021', 'ORD-1041', 'ORD-1042'] } },
            { customerName: { $regex: /test|sample/i } },
            { customerName: 'Rohan Sharma' },
            { customerName: 'Test Customer' },
          ],
        });
        console.log(`🗑️ Deleted ${deleteResult.deletedCount} dummy orders from MongoDB Atlas.`);

        await Table.findOneAndUpdate(
          { number: '02' },
          {
            status: 'AVAILABLE',
            currentOrderId: null,
            customerName: null,
            amount: 0,
            occupiedSince: null,
          }
        );
        console.log('🪑 Table 02 reset in MongoDB Atlas.');
      } catch (atlasErr) {
        console.warn('ℹ️ MongoDB Atlas offline/unreachable. Local db clean completed successfully.');
      }
    }

    console.log('✨ Cleanup of dummy data completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
};

cleanDummyOrders();
