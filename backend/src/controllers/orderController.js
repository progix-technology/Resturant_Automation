import mongoose from 'mongoose';
import { db } from '../data/db.js';
import { Order } from '../models/Order.js';
import { Table } from '../models/Table.js';

const isDummyOrder = (o) => {
  if (!o) return true;
  const id = o.orderId || o.id || '';
  const name = (o.customerName || '').toLowerCase();
  if (['ORD-1526', 'ORD-8021', 'ORD-1041', 'ORD-1042'].includes(id)) return true;
  if (name.includes('test') || name.includes('sample') || name === 'rohan sharma') return true;
  return false;
};

export const orderController = {
  /**
   * Get all orders
   */
  async getOrders(req, res) {
    try {
      const { slug } = req.query;
      const cleanSlug = slug ? slug.replace(/^the-/, '') : '';

      // 1. Get in-memory / local orders first (instant)
      let localOrders = db.get('orders') || [];

      // 2. Try fetching from MongoDB Atlas ONLY if connection is ready (readyState === 1)
      let mongoOrders = [];
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          const query = slug
            ? {
              $or: [
                { restaurantSlug: slug },
                { restaurantSlug: cleanSlug },
                { restaurantSlug: `the-${cleanSlug}` },
              ],
            }
            : {};
          const mongoPromise = Order.find(query).lean().sort({ createdAt: -1 });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Atlas query timeout')), 300)
          );
          mongoOrders = await Promise.race([mongoPromise, timeoutPromise]);
        } catch (mErr) {
          // Graceful fallback to local store
        }
      }

      // 3. Merge both sources (deduplicate by orderId or id)
      const orderMap = new Map();

      // Put mongo orders first
      if (Array.isArray(mongoOrders)) {
        mongoOrders.forEach((o) => {
          if (isDummyOrder(o)) return;
          const key = o.orderId || o.id || o._id?.toString();
          if (key) {
            orderMap.set(key, {
              ...o,
              orderId: o.orderId || key,
              id: o.orderId || key,
            });
          }
        });
      }

      // Merge local orders (local orders override if present and updated)
      if (Array.isArray(localOrders)) {
        localOrders.forEach((o) => {
          if (isDummyOrder(o)) return;
          const key = o.orderId || o.id;
          if (key) {
            orderMap.set(key, { ...o });
          }
        });
      }

      let combined = Array.from(orderMap.values());

      // Filter by slug if requested
      if (cleanSlug) {
        combined = combined.filter((o) => {
          const s = (o.restaurantSlug || '').replace(/^the-/, '');
          return s === cleanSlug;
        });
      }

      combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.status(200).json({
        success: true,
        count: combined.length,
        data: combined,
      });
    } catch (err) {
      console.error('getOrders error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
  },

  /**
   * Get order by ID
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;

      // Try local store first
      const orders = db.get('orders') || [];
      const localOrder = orders.find((o) => o.orderId === id || o.id === id);
      if (localOrder) {
        return res.status(200).json({ success: true, data: localOrder });
      }

      // Try MongoDB
      try {
        const mongoOrder = await Order.findOne({ $or: [{ orderId: id }, { _id: id }] }).lean();
        if (mongoOrder) {
          return res.status(200).json({ success: true, data: mongoOrder });
        }
      } catch (mErr) {
        // Fallback
      }

      return res.status(404).json({ success: false, message: 'Order not found' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error retrieving order' });
    }
  },

  /**
   * Create new order (From Customer QR Menu checkout)
   */
  async createOrder(req, res) {
    try {
      const {
        restaurantSlug = 'spice-garden',
        customerName,
        mobile,
        tableNumber,
        items,
        subtotal,
        taxes,
        total,
        paymentMethod = 'UPI',
        notes,
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Order must contain items' });
      }

      const cleanSlug = (restaurantSlug || 'spice-garden').replace(/^the-/, '');
      const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const normalizedTableNumber = tableNumber ? String(tableNumber).padStart(2, '0') : '01';

      const normalizedItems = items.map((it) => ({
        id: it.id || it.itemId || it.cartItemId || `item-${Math.random().toString(36).substr(2, 5)}`,
        name: it.name || 'Dish',
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        isVeg: it.isVeg ?? true,
      }));

      const numSubtotal = Number(subtotal) || normalizedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const numTaxes = Number(taxes) || Math.round(numSubtotal * 0.05);
      const numTotal = Number(total) || (numSubtotal + numTaxes);

      const newOrder = {
        orderId,
        id: orderId,
        restaurantSlug: cleanSlug,
        customerName: customerName ? String(customerName).trim() : 'Guest Diner',
        mobile: mobile ? String(mobile).trim() : '',
        tableNumber: normalizedTableNumber,
        items: normalizedItems,
        subtotal: numSubtotal,
        taxes: numTaxes,
        total: numTotal,
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod || 'UPI',
        etaMinutes: 25,
        notes: notes || '',
        createdAt: new Date().toISOString(),
      };

      // 1. Immediately update orders in local store (INSTANT 0ms, NEVER FAILS)
      // Note: Table reservation/occupancy status is NOT automatically changed - strictly managed manually by Admin!
      const orders = db.get('orders') || [];
      const nextOrders = [newOrder, ...orders.filter((o) => o.orderId !== orderId)];
      db.set('orders', nextOrders);

      // 2. Respond immediately to client so UI receives instant confirmation
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: newOrder,
      });

      // 3. Asynchronously push to MongoDB Atlas in background (Non-blocking)
      Order.create(newOrder)
        .catch((mErr) => {
          console.warn('MongoDB Atlas order insert background warning:', mErr.message);
        });
    } catch (err) {
      console.error('createOrder error:', err);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to create order' });
      }
    }
  },

  /**
   * Update order status (Admin operation)
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, etaMinutes } = req.body;

      // 1. Update in local store FIRST (instant 0ms)
      const orders = db.get('orders') || [];
      let updatedOrder = null;

      const nextOrders = orders.map((o) => {
        if (o.orderId === id || o.id === id) {
          updatedOrder = {
            ...o,
            orderStatus: status || o.orderStatus,
            etaMinutes: etaMinutes !== undefined ? Number(etaMinutes) : o.etaMinutes,
            updatedAt: new Date().toISOString(),
          };
          return updatedOrder;
        }
        return o;
      });

      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Note: Table reservation/unreservation status is strictly managed manually by Admin!
      db.set('orders', nextOrders);

      // 2. Respond immediately to admin client (0ms latency!)
      res.status(200).json({
        success: true,
        message: `Order #${id} status updated to ${status}`,
        data: updatedOrder,
      });

      // 3. Asynchronously sync to MongoDB Atlas in background
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        Order.findOneAndUpdate(
          { orderId: id },
          {
            orderStatus: status,
            ...(etaMinutes !== undefined ? { etaMinutes: Number(etaMinutes) } : {}),
          }
        ).catch(() => { });
      }
    } catch (err) {
      console.error('updateOrderStatus error:', err);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to update order' });
      }
    }
  },

  /**
   * Mark order payment completed (and optionally mark served when Done is clicked)
   */
  async markPaymentPaid(req, res) {
    try {
      const { id } = req.params;
      const { method = 'UPI', markServed = true } = req.body;

      // 1. Update in local store FIRST (instant 0ms)
      const orders = db.get('orders') || [];
      let updatedOrder = null;

      const nextOrders = orders.map((o) => {
        if (o.orderId === id || o.id === id) {
          updatedOrder = {
            ...o,
            paymentStatus: 'COMPLETED',
            paymentMethod: method,
            paidAt: new Date().toISOString(),
            ...(markServed ? { orderStatus: 'SERVED' } : {}),
          };
          return updatedOrder;
        }
        return o;
      });

      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Note: Table status remains purely manual as per user instructions
      db.set('orders', nextOrders);

      // 2. Respond immediately
      res.status(200).json({
        success: true,
        message: `Payment completed for Order #${id}${markServed ? ' & marked as SERVED' : ''}`,
        data: updatedOrder,
      });

      // 3. Asynchronously sync to MongoDB Atlas in background
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        Order.findOneAndUpdate(
          { orderId: id },
          {
            paymentStatus: 'COMPLETED',
            paymentMethod: method,
            ...(markServed ? { orderStatus: 'SERVED' } : {}),
          }
        ).catch(() => { });
      }
    } catch (err) {
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to record payment' });
      }
    }
  },

  /**
   * Reset all orders, sales, and tables (Clean Slate / Fresh Start)
   */
  async resetOrders(req, res) {
    try {
      // 1. Clear local store FIRST (instant 0ms)
      db.set('orders', []);

      const tables = db.get('tables') || [];
      const resetTables = tables.map((t) => ({
        ...t,
        status: 'AVAILABLE',
        currentOrderId: null,
        customerName: null,
        amount: 0,
        occupiedSince: null,
      }));
      db.set('tables', resetTables);

      // 2. Respond immediately
      res.status(200).json({
        success: true,
        message: 'All orders, revenue, and customer history reset to 0 successfully',
        data: {
          ordersCount: 0,
          totalRevenue: 0,
          tablesReset: resetTables.length,
        },
      });

      // 3. Clean MongoDB Atlas asynchronously in background
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        Order.deleteMany({}).catch(() => { });
        Table.updateMany(
          {},
          {
            $set: {
              status: 'AVAILABLE',
              currentOrderId: null,
              customerName: null,
              amount: 0,
              occupiedSince: null,
            },
          }
        ).catch(() => { });
      }
    } catch (err) {
      console.error('resetOrders error:', err);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: 'Failed to reset orders' });
      }
    }
  },
};
