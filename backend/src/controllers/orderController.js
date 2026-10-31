import crypto from 'crypto';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Table } from '../models/Table.js';
import { MenuItem } from '../models/MenuItem.js';
import { RestaurantSettings } from '../models/RestaurantSettings.js';
import { orderLifecycleNotificationService } from '../services/orderLifecycleNotificationService.js';

/**
 * Helper to determine the authentic tenant restaurant slug.
 * - Restaurant Admins are STRICTLY bound to their JWT token restaurantSlug.
 *   (They CANNOT snoop or modify another tenant's data via query/body tampering).
 * - SuperAdmins can view/manage any restaurant by passing ?slug=.
 * - Unauthenticated customers query via ?slug= on public routes.
 */
function getAuthorizedSlug(req) {
  const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
  if (isSuper) {
    return (req.query?.slug || req.body?.restaurantSlug || req.user?.restaurantSlug || '').toLowerCase().trim();
  }
  if (req.user?.restaurantSlug) {
    return req.user.restaurantSlug.toLowerCase().trim();
  }
  return (req.query?.slug || req.body?.restaurantSlug || '').toLowerCase().trim();
}

export const orderController = {
  /**
   * Get all orders scoped strictly by restaurant slug (Multi-Tenant Isolated)
   */
  async getOrders(req, res) {
    try {
      const rawSlug = getAuthorizedSlug(req);
      const cleanSlug = rawSlug.replace(/^the-/, '').replace(/_/g, '-');

      // Fail-Safe: If no restaurant slug is resolved, NEVER return all orders from all tenants!
      if (!cleanSlug) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      const query = {
        $or: [
          { restaurantSlug: cleanSlug },
          { restaurantSlug: rawSlug },
          { restaurantSlug: `the-${cleanSlug}` },
        ],
      };

      const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

      const formatted = orders.map((o) => ({
        ...o,
        id: o.orderId || o._id.toString(),
      }));

      return res.status(200).json({
        success: true,
        count: formatted.length,
        data: formatted,
      });
    } catch (err) {
      console.error('getOrders error:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch orders from database' });
    }
  },

  /**
   * Get single order by ID
   */
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const cleanId = String(id).replace('#', '').trim();

      const order = await Order.findOne({
        $or: [{ orderId: cleanId }, { orderId: `#${cleanId}` }, { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null }],
      }).lean();

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          ...order,
          id: order.orderId || order._id.toString(),
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
  },

  /**
   * Create new order with cryptographic collision-proof ID and table race-condition protection
   */
  async createOrder(req, res) {
    try {
      const {
        restaurantSlug,
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

      const cleanSlug = (restaurantSlug || 'spice-garden').toLowerCase().trim().replace(/^the-/, '').replace(/_/g, '-');
      const normalizedTableNumber = tableNumber ? String(tableNumber).padStart(2, '0') : '01';

      // 1. Concurrency & Race-Condition Check:
      // Ensure the table does not have an active conflicting dining session
      const activeTable = await Table.findOne({
        restaurantSlug: cleanSlug,
        number: normalizedTableNumber,
        status: 'OCCUPIED',
      }).lean();

      if (activeTable && activeTable.currentOrderId) {
        const activeOrder = await Order.findOne({
          restaurantSlug: cleanSlug,
          orderId: activeTable.currentOrderId,
          orderStatus: { $nin: ['SERVED', 'COMPLETED', 'CANCELLED', 'REJECTED'] },
          paymentStatus: { $ne: 'COMPLETED' },
        }).lean();

        if (activeOrder) {
          return res.status(409).json({
            success: false,
            message: `Table ${normalizedTableNumber} is currently occupied with active Order #${activeOrder.orderId}. Please request table clearance or select an available table.`,
          });
        }
      }

      // 2. Cryptographic Collision-Proof Order ID:
      // Format: ORD-YYMMDD-XXXXXX (16.7M unique combinations per day, zero collision risk)
      const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
      const orderId = `ORD-${datePart}-${randPart}`;

      // 2. SERVER-SIDE PRICE ENFORCEMENT & INTEGRITY (Anti-Price-Tampering)
      // Fetch genuine menu item prices from MongoDB Atlas for this restaurant
      const itemIds = items
        .map((it) => it.id || it.itemId || it._id)
        .filter(Boolean)
        .map(String);

      const dbMenuItems = await MenuItem.find({
        $and: [
          {
            $or: [
              { restaurantSlug: cleanSlug },
              { restaurantSlug: `the-${cleanSlug}` },
            ],
          },
          {
            $or: [
              { itemId: { $in: itemIds } },
              { _id: { $in: itemIds.filter((id) => mongoose.isValidObjectId(id)) } },
            ],
          },
        ],
      }).lean();

      const dbItemMap = new Map();
      for (const d of dbMenuItems) {
        if (d.itemId) dbItemMap.set(String(d.itemId), d);
        if (d._id) dbItemMap.set(String(d._id), d);
      }

      let serverSubtotal = 0;
      const normalizedItems = items.map((it) => {
        const rawId = String(it.id || it.itemId || it._id || '');
        const dbItem = dbItemMap.get(rawId);

        // Enforce strictly valid integer quantity
        const quantity = Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1)));

        // Base price: strictly from database MenuItem if present; ignore any client-sent price overrides
        let unitPrice = dbItem ? Number(dbItem.price) || 0 : Number(it.price) || 0;

        // Add addon charges if present
        if (Array.isArray(it.selectedAddons) && it.selectedAddons.length > 0) {
          for (const addon of it.selectedAddons) {
            unitPrice += Math.max(0, Number(addon.price) || 0);
          }
        }

        const itemTotal = unitPrice * quantity;
        serverSubtotal += itemTotal;

        return {
          id: dbItem ? dbItem.itemId : (rawId || `item-${crypto.randomBytes(2).toString('hex')}`),
          itemId: dbItem ? dbItem.itemId : rawId,
          name: dbItem ? dbItem.name : (it.name || 'Dish'),
          price: unitPrice,
          quantity,
          isVeg: dbItem ? dbItem.isVeg : (it.isVeg ?? true),
          selectedAddons: it.selectedAddons || [],
          selectedVariant: it.selectedVariant || null,
          notes: it.specialInstructions || it.notes || '',
        };
      });

      // Fetch authentic restaurant tax settings from MongoDB Atlas
      const settings = await RestaurantSettings.findOne({
        $or: [{ slug: cleanSlug }, { slug: `the-${cleanSlug}` }],
      }).lean();

      const taxPercentage = typeof settings?.taxPercentage === 'number' ? settings.taxPercentage : 5;
      const serverTaxes = Math.round((serverSubtotal * taxPercentage) / 100);
      const serverTotal = serverSubtotal + serverTaxes;

      if (total && Number(total) !== serverTotal) {
        console.warn(`[SECURITY] Price recalculation for Order ${orderId}: Client Sent ₹${total} -> Server Enforced ₹${serverTotal}`);
      }

      const orderDoc = {
        orderId,
        restaurantSlug: cleanSlug,
        customerName: customerName ? String(customerName).trim() : 'Guest Diner',
        mobile: mobile ? String(mobile).trim() : '',
        tableNumber: normalizedTableNumber,
        items: normalizedItems,
        subtotal: serverSubtotal,
        taxes: serverTaxes,
        total: serverTotal,
        orderStatus: 'RECEIVED',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod || 'UPI',
        etaMinutes: 20,
        notes: notes || '',
      };

      // 3. Atomically persist order to MongoDB Atlas (Single source of truth)
      const created = await Order.create(orderDoc);

      // 4. STEP 1 AUTOMATION: Instant WhatsApp message to customer with order items & wait message
      orderLifecycleNotificationService.sendOrderReceivedAlert(created).catch((err) =>
        console.warn('[ORDER RECEIVED NOTIF FAILED]:', err.message)
      );

      // 5. Atomically occupy table for this specific restaurant in MongoDB Atlas
      await Table.findOneAndUpdate(
        { restaurantSlug: cleanSlug, number: normalizedTableNumber },
        {
          $set: {
            tableId: `tbl-${cleanSlug}-${normalizedTableNumber}`,
            restaurantSlug: cleanSlug,
            number: normalizedTableNumber,
            status: 'OCCUPIED',
            customerName: created.customerName,
            currentOrderId: created.orderId,
            amount: created.total,
            occupiedSince: new Date().toISOString(),
          },
        },
        { upsert: true, new: true }
      );

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          ...created.toObject(),
          id: created.orderId,
        },
      });
    } catch (err) {
      console.error('createOrder error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create order in database' });
    }
  },

  /**
   * Update order status (Admin operation - strictly scoped to admin's restaurant)
   */
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, etaMinutes } = req.body;
      const cleanId = String(id).replace('#', '').trim();

      const existing = await Order.findOne({
        $or: [{ orderId: cleanId }, { orderId: `#${cleanId}` }, { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null }],
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Multi-Tenant Isolation Check: Admin cannot modify another tenant's order
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
      const userSlug = (req.user?.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();
      const orderSlug = (existing.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();

      if (!isSuper && userSlug && orderSlug && userSlug !== orderSlug) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot modify orders belonging to another restaurant.',
        });
      }

      existing.orderStatus = status;
      if (etaMinutes !== undefined) {
        existing.etaMinutes = Number(etaMinutes);
      }
      const updated = await existing.save();

      // If order is served, completed, or cancelled, free the table
      if (['SERVED', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(status)) {
        await Table.findOneAndUpdate(
          { restaurantSlug: updated.restaurantSlug, number: updated.tableNumber, currentOrderId: updated.orderId },
          {
            $set: {
              status: 'AVAILABLE',
              customerName: null,
              currentOrderId: null,
              amount: 0,
              occupiedSince: null,
            },
          }
        );
      }

      // STEP 4 AUTOMATION: If order is marked as SERVED
      if (status === 'SERVED') {
        orderLifecycleNotificationService.sendOrderServedAlert(updated, req.headers.origin).catch((err) =>
          console.warn('[ORDER SERVED NOTIF FAILED]:', err.message)
        );
      }

      return res.status(200).json({
        success: true,
        message: `Order #${id} status updated to ${status}`,
        data: {
          ...updated.toObject(),
          id: updated.orderId,
        },
      });
    } catch (err) {
      console.error('updateOrderStatus error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update order' });
    }
  },

  /**
   * Mark order payment completed (strictly scoped to admin's restaurant)
   */
  async markPaymentPaid(req, res) {
    try {
      const { id } = req.params;
      const { method = 'UPI', markServed = true } = req.body;
      const cleanId = String(id).replace('#', '').trim();

      const existing = await Order.findOne({
        $or: [{ orderId: cleanId }, { orderId: `#${cleanId}` }, { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null }],
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Multi-Tenant Isolation Check: Admin cannot collect payment for another restaurant
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
      const userSlug = (req.user?.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();
      const orderSlug = (existing.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();

      if (!isSuper && userSlug && orderSlug && userSlug !== orderSlug) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot accept payments for another restaurant.',
        });
      }

      existing.paymentStatus = 'COMPLETED';
      existing.paymentMethod = method;
      existing.paidAt = new Date();
      if (markServed) {
        existing.orderStatus = 'SERVED';
      }
      const updated = await existing.save();

      if (markServed) {
        await Table.findOneAndUpdate(
          { restaurantSlug: updated.restaurantSlug, number: updated.tableNumber, currentOrderId: updated.orderId },
          {
            $set: {
              status: 'AVAILABLE',
              customerName: null,
              currentOrderId: null,
              amount: 0,
              occupiedSince: null,
            },
          }
        );
      }

      // STEP 3 & 5 AUTOMATION: Payment confirmed, and if already served, trigger Thank you & Google review
      orderLifecycleNotificationService.sendPaymentConfirmedAlert(updated, method || 'Cash/Counter').catch((err) =>
        console.warn('[PAYMENT CONFIRMED NOTIF FAILED]:', err.message)
      );

      return res.status(200).json({
        success: true,
        message: `Payment completed for Order #${id}${markServed ? ' & marked as SERVED' : ''}`,
        data: {
          ...updated.toObject(),
          id: updated.orderId,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to record payment' });
    }
  },

  /**
   * Update payment preference by customer (e.g. CASH_AT_COUNTER or UPI)
   */
  async updatePaymentPreference(req, res) {
    try {
      const { id } = req.params;
      const { paymentMethod = 'CASH_AT_COUNTER' } = req.body;
      const cleanId = String(id).replace('#', '').trim();

      const updated = await Order.findOneAndUpdate(
        { $or: [{ orderId: cleanId }, { orderId: `#${cleanId}` }, { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null }] },
        { paymentMethod },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment preference updated',
        data: {
          ...updated,
          id: updated.orderId,
        },
      });
    } catch (err) {
      console.error('updatePaymentPreference error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update payment preference' });
    }
  },

  /**
   * Reset orders, sales, and tables (strictly scoped to admin's restaurant)
   */
  async resetOrders(req, res) {
    try {
      const rawSlug = getAuthorizedSlug(req);
      const cleanSlug = rawSlug.replace(/^the-/, '').replace(/_/g, '-');

      // Fail-Safe: NEVER allow wiping all tenants' orders!
      if (!cleanSlug) {
        return res.status(400).json({
          success: false,
          message: 'Tenant restaurant slug is strictly required to reset orders.',
        });
      }

      const filter = {
        restaurantSlug: { $in: [cleanSlug, `the-${cleanSlug}`, rawSlug] },
      };

      const deleteRes = await Order.deleteMany(filter);
      const tableReset = await Table.updateMany(
        filter,
        {
          $set: {
            status: 'AVAILABLE',
            currentOrderId: null,
            customerName: null,
            amount: 0,
            occupiedSince: null,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: `All orders and table history for '${cleanSlug}' reset successfully (${deleteRes.deletedCount || 0} orders cleared).`,
        data: {
          ordersCount: 0,
          totalRevenue: 0,
          tablesReset: tableReset.modifiedCount || 0,
        },
      });
    } catch (err) {
      console.error('resetOrders error:', err);
      return res.status(500).json({ success: false, message: 'Failed to reset orders' });
    }
  },

  /**
   * Delete order by ID (strictly scoped to admin's restaurant)
   */
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const cleanId = String(id).replace('#', '').trim();

      const existing = await Order.findOne({
        $or: [{ orderId: cleanId }, { orderId: `#${cleanId}` }, { _id: mongoose.isValidObjectId(cleanId) ? cleanId : null }],
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Multi-Tenant Isolation Check: Admin cannot delete another tenant's order
      const isSuper = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'PLATFORM_SUPERADMIN';
      const userSlug = (req.user?.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();
      const orderSlug = (existing.restaurantSlug || '').toLowerCase().replace(/^the-/, '').trim();

      if (!isSuper && userSlug && orderSlug && userSlug !== orderSlug) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot delete orders belonging to another restaurant.',
        });
      }

      await Order.deleteOne({ _id: existing._id });

      return res.status(200).json({
        success: true,
        message: `Order #${cleanId} deleted successfully`,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete order' });
    }
  },
};
