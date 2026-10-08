import mongoose from 'mongoose';
import { db } from '../data/db.js';
import { Table } from '../models/Table.js';
import { Order } from '../models/Order.js';

const cleanNum = (val) => {
  if (val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  return digits ? String(parseInt(digits, 10)) : String(val).toLowerCase().trim();
};

export const tableController = {
  async getTables(req, res) {
    try {
      let tables = [];

      // 1. Try fetching from MongoDB Atlas FIRST if connected
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const mongoTables = await Table.find().lean();
          if (mongoTables && mongoTables.length > 0) {
            tables = mongoTables.map((t) => ({
              id: t.tableId || t._id.toString(),
              tableId: t.tableId || t._id.toString(),
              number: t.number || t.tableNumber || '01',
              capacity: t.capacity || 4,
              section: t.section || 'Main Dining',
              status: t.status || 'AVAILABLE',
              currentOrderId: t.currentOrderId || null,
              customerName: t.customerName || null,
              amount: t.amount || 0,
              occupiedSince: t.occupiedSince || null,
            }));
          }
        } catch (mErr) {
          console.warn('[TABLES] MongoDB lookup error:', mErr.message);
        }
      }

      // 2. Fallback to local store if Mongo is empty or disconnected
      if (tables.length === 0) {
        tables = db.get('tables') || [];
      }

      // 3. Fetch active orders from local DB & MongoDB to dynamically derive real-time table status
      const localOrders = db.get('orders') || [];
      let mongoOrders = [];
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          mongoOrders = await Order.find({
            $or: [
              { orderStatus: { $nin: ['CANCELLED', 'COMPLETED', 'REJECTED'] } },
              { paymentStatus: { $ne: 'COMPLETED' } }
            ]
          }).lean();
        } catch (e) {}
      }

      const allOrders = [...localOrders, ...mongoOrders];

      // Map dynamic status onto tables
      const dynamicTables = tables.map((t) => {
        const tableClean = cleanNum(t.number || t.id || t.tableId);

        // Find active order for this table (not completed or unpaid)
        const activeOrder = allOrders.find((o) => {
          const oTableClean = cleanNum(o.tableNumber);
          const matchesTable = oTableClean && tableClean && oTableClean === tableClean;
          const isActive = o.paymentStatus !== 'COMPLETED' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'COMPLETED' && o.orderStatus !== 'REJECTED';
          return matchesTable && isActive;
        });

        if (activeOrder) {
          return {
            ...t,
            status: 'OCCUPIED',
            currentOrderId: activeOrder.orderId || activeOrder.id,
            customerName: activeOrder.customerName || t.customerName || 'Guest Diner',
            amount: activeOrder.total || t.amount || 0,
            occupiedSince: t.occupiedSince || activeOrder.createdAt || new Date().toISOString(),
          };
        }

        // If no active order exists, keep manual status (RESERVED, CLEANING, or manually set OCCUPIED)
        return t;
      });

      return res.status(200).json({ success: true, data: dynamicTables });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch tables' });
    }
  },

  async updateTableStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, customerName } = req.body;
      const targetClean = cleanNum(id);

      // Update MongoDB Atlas if connected
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const mongoTables = await Table.find();
          const targetDoc = mongoTables.find((t) => cleanNum(t.tableId) === targetClean || cleanNum(t.number) === targetClean);
          if (targetDoc) {
            targetDoc.status = status;
            if (status === 'AVAILABLE') {
              targetDoc.currentOrderId = null;
              targetDoc.customerName = null;
              targetDoc.amount = 0;
              targetDoc.occupiedSince = null;
            } else if (customerName) {
              targetDoc.customerName = customerName;
            }
            await targetDoc.save();
          }
        } catch (mErr) {
          console.warn('MongoDB table update warning:', mErr.message);
        }
      }

      const tables = db.get('tables') || [];
      let updatedTable = null;

      const next = tables.map((t) => {
        if (cleanNum(t.id) === targetClean || cleanNum(t.tableId) === targetClean || cleanNum(t.number) === targetClean) {
          updatedTable = {
            ...t,
            status,
            currentOrderId: status === 'AVAILABLE' ? null : t.currentOrderId,
            customerName: status === 'AVAILABLE' ? null : (customerName || t.customerName),
            amount: status === 'AVAILABLE' ? 0 : t.amount,
            occupiedSince: status === 'AVAILABLE' ? null : t.occupiedSince,
          };
          return updatedTable;
        }
        return t;
      });

      if (!updatedTable) {
        updatedTable = { id, number: id, status, customerName };
      }

      db.set('tables', next);
      return res.status(200).json({ success: true, data: updatedTable });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update table' });
    }
  },

  async addTable(req, res) {
    try {
      const { number, capacity, section, restaurantSlug } = req.body;
      const tables = db.get('tables') || [];

      // Fetch restaurant settings for plan limit check
      const restaurants = db.get('restaurants') || [];
      const cleanSlug = (restaurantSlug || 'spice-garden').toLowerCase().trim().replace(/_/g, '-');
      const restSettings = restaurants.find((r) => (r.slug || '').toLowerCase().replace(/_/g, '-') === cleanSlug) || {};

      const planName = (restSettings.planName || '').toLowerCase();
      const planId = (restSettings.planId || '').toLowerCase();

      let maxTables = restSettings.maxTables;
      if (maxTables === undefined) {
        if (planId.includes('enterprise') || planName.includes('enterprise')) {
          maxTables = 50;
        } else if (planId.includes('growth') || planName.includes('growth') || planName.includes('pro')) {
          maxTables = 30;
        } else {
          maxTables = 10; // Starter plan limit
        }
      }

      if (tables.length >= maxTables) {
        return res.status(403).json({
          success: false,
          message: `Table limit reached (${tables.length}/${maxTables}). Please upgrade your plan to add more tables.`,
        });
      }

      const newTable = {
        id: `tbl-${Date.now().toString().slice(-4)}`,
        tableId: `tbl-${Date.now().toString().slice(-4)}`,
        number: String(number).padStart(2, '0'),
        capacity: Number(capacity) || 4,
        section: section || 'Main Dining',
        status: 'AVAILABLE',
        currentOrderId: null,
        customerName: null,
        amount: 0,
        occupiedSince: null,
      };

      db.set('tables', [...tables, newTable]);

      if (mongoose.connection && mongoose.connection.readyState === 1) {
        Table.create(newTable).catch((mErr) => console.warn('[TABLES] Mongo create table warning:', mErr.message));
      }

      return res.status(201).json({ success: true, data: newTable });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to add table' });
    }
  },
};
