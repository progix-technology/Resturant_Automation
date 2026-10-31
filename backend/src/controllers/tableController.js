import mongoose from 'mongoose';
import { Table } from '../models/Table.js';
import { Order } from '../models/Order.js';
import { db } from '../data/db.js';

const cleanNum = (val) => {
  if (val === null || val === undefined) return '';
  const digits = String(val).replace(/\D/g, '');
  return digits ? String(parseInt(digits, 10)) : String(val).toLowerCase().trim();
};

export const tableController = {
  /**
   * Get tables scoped strictly by restaurant
   */
  async getTables(req, res) {
    try {
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
      const rawSlug = isSuper
        ? (req.query.slug || req.user?.restaurantSlug || 'spice-garden').toLowerCase().trim()
        : (req.user?.restaurantSlug || req.query.slug || 'spice-garden').toLowerCase().trim();
      const cleanSlug = rawSlug.replace(/^the-/, '').replace(/_/g, '-');

      // Fast instant fallback if MongoDB is not connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        const localTables = db.get('tables') || [];
        return res.status(200).json({ success: true, data: localTables });
      }

      const query = {
        $or: [
          { restaurantSlug: cleanSlug },
          { restaurantSlug: rawSlug },
          { restaurantSlug: `the-${cleanSlug}` },
        ],
      };

      const mongoTables = await Table.find(query).sort({ number: 1 }).lean();

      // Fetch active orders for this specific restaurant only
      const activeOrders = await Order.find({
        ...query,
        orderStatus: { $nin: ['CANCELLED', 'COMPLETED', 'REJECTED'] },
        paymentStatus: { $ne: 'COMPLETED' },
      }).lean();

      const dynamicTables = mongoTables.map((t) => {
        const tableClean = cleanNum(t.number || t.tableId);

        const activeOrder = activeOrders.find((o) => {
          const oTableClean = cleanNum(o.tableNumber);
          return oTableClean && tableClean && oTableClean === tableClean;
        });

        if (activeOrder) {
          return {
            ...t,
            id: t.tableId || t._id.toString(),
            status: 'OCCUPIED',
            currentOrderId: activeOrder.orderId,
            customerName: activeOrder.customerName || t.customerName || 'Guest Diner',
            amount: activeOrder.total || t.amount || 0,
            occupiedSince: t.occupiedSince || activeOrder.createdAt || new Date().toISOString(),
          };
        }

        return {
          ...t,
          id: t.tableId || t._id.toString(),
        };
      });

      return res.status(200).json({ success: true, data: dynamicTables });
    } catch (err) {
      console.error('getTables error, using fallback:', err.message);
      const localTables = db.get('tables') || [];
      return res.status(200).json({ success: true, data: localTables });
    }
  },

  /**
   * Update table status
   */
  async updateTableStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, customerName } = req.body;
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
      const rawSlug = isSuper
        ? (req.query.slug || req.user?.restaurantSlug || 'spice-garden').toLowerCase().trim()
        : (req.user?.restaurantSlug || req.query.slug || 'spice-garden').toLowerCase().trim();
      const cleanSlug = rawSlug.replace(/^the-/, '').replace(/_/g, '-');
      const targetClean = cleanNum(id);

      const updated = await Table.findOneAndUpdate(
        {
          $or: [
            { restaurantSlug: cleanSlug, number: targetClean },
            { restaurantSlug: cleanSlug, number: String(targetClean).padStart(2, '0') },
            { restaurantSlug: cleanSlug, tableId: id },
            { _id: mongoose.isValidObjectId(id) ? id : null },
          ],
        },
        {
          status,
          customerName: customerName || null,
          ...(status === 'AVAILABLE' ? { currentOrderId: null, amount: 0, occupiedSince: null } : {}),
          ...(status === 'OCCUPIED' ? { occupiedSince: new Date().toISOString() } : {}),
        },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Table not found' });
      }

      return res.status(200).json({
        success: true,
        message: `Table status updated to ${status}`,
        data: {
          ...updated,
          id: updated.tableId || updated._id.toString(),
        },
      });
    } catch (err) {
      console.error('updateTableStatus error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update table' });
    }
  },

  /**
   * Add a new table for the restaurant (Multi-Tenant Protected)
   */
  async addTable(req, res) {
    try {
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
      const rawSlug = isSuper
        ? (req.body.restaurantSlug || req.user?.restaurantSlug || 'spice-garden').toLowerCase().trim()
        : (req.user?.restaurantSlug || 'spice-garden').toLowerCase().trim();
      const cleanSlug = rawSlug.replace(/^the-/, '').replace(/_/g, '-');
      const { number, capacity, section } = req.body;

      const numStr = String(number).padStart(2, '0');

      const existing = await Table.findOne({ restaurantSlug: cleanSlug, number: numStr });
      if (existing) {
        return res.status(400).json({ success: false, message: `Table ${numStr} already exists for this restaurant` });
      }

      const newTable = await Table.create({
        tableId: `tbl-${cleanSlug}-${numStr}`,
        restaurantSlug: cleanSlug,
        number: numStr,
        capacity: Number(capacity) || 4,
        section: section || 'Main Dining',
        status: 'AVAILABLE',
      });

      return res.status(201).json({
        success: true,
        message: 'Table added successfully',
        data: {
          ...newTable.toObject(),
          id: newTable.tableId,
        },
      });
    } catch (err) {
      console.error('addTable error:', err);
      return res.status(500).json({ success: false, message: 'Failed to add table' });
    }
  },
};
