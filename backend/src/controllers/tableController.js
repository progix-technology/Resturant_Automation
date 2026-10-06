import mongoose from 'mongoose';
import { db } from '../data/db.js';
import { Table } from '../models/Table.js';

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

      return res.status(200).json({ success: true, data: tables });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch tables' });
    }
  },

  async updateTableStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, customerName } = req.body;

      // Update MongoDB Atlas if connected
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        Table.findOneAndUpdate(
          { $or: [{ tableId: id }, { number: id }] },
          {
            status,
            ...(status === 'AVAILABLE'
              ? { currentOrderId: null, customerName: null, amount: 0, occupiedSince: null }
              : status === 'RESERVED' && customerName
                ? { customerName }
                : {}),
          }
        ).catch((mErr) => {
          console.warn('MongoDB table update warning:', mErr.message);
        });
      }

      const tables = db.get('tables') || [];
      let updatedTable = null;

      const next = tables.map((t) => {
        if (t.id === id || t.number === id) {
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
      const { number, capacity, section } = req.body;
      const tables = db.get('tables') || [];

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
