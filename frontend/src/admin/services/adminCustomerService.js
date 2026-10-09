import { adminOrderService } from './adminOrderService';
import { simulateDelay } from '../../services/apiConfig';

export const adminCustomerService = {
  /**
   * Helper to build customer records from orders array
   */
  processOrders(orders = []) {
    const customerMap = new Map();

    (orders || []).forEach((order, index) => {
      const name = (order.customerName || order.name || 'Guest Diner').trim();
      const mobile = (order.mobile || order.customerPhone || '').trim();

      // Create a unique key per customer profile
      let customerKey = '';
      if (mobile && mobile !== 'Unknown') {
        customerKey = `mobile-${mobile}`;
      } else if (name && name !== 'Guest Diner') {
        customerKey = `name-${name.toLowerCase()}`;
      } else {
        customerKey = `order-${order.orderId || order.id || index}`;
      }

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: `cust-${customerKey}`,
          name: name || 'Guest Diner',
          mobile: mobile || '',
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt || new Date().toISOString(),
          lastTable: order.tableNumber || '01',
          orders: [],
        });
      }

      const record = customerMap.get(customerKey);
      record.ordersCount += 1;
      record.totalSpent += Number(order.total || order.amount || 0);
      record.orders.push(order);

      // Maintain latest visit details
      const orderTime = new Date(order.createdAt || Date.now()).getTime();
      const lastTime = new Date(record.lastOrderDate).getTime();
      if (isNaN(lastTime) || orderTime >= lastTime) {
        record.lastOrderDate = order.createdAt || record.lastOrderDate;
        record.lastTable = order.tableNumber || record.lastTable;
        if (name && name !== 'Guest Diner') record.name = name;
        if (mobile) record.mobile = mobile;
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => {
      const dB = new Date(b.lastOrderDate).getTime() || 0;
      const dA = new Date(a.lastOrderDate).getTime() || 0;
      return dB - dA;
    });
  },

  /**
   * Aggregates unique guest diners from all recorded orders
   */
  async getCustomers(providedOrders = null) {
    if (providedOrders && Array.isArray(providedOrders)) {
      return this.processOrders(providedOrders);
    }
    await simulateDelay(150);
    const orders = await adminOrderService.getOrders();
    return this.processOrders(orders);
  },

  async getCustomerByMobile(mobile) {
    const customers = await this.getCustomers();
    const found = customers.find((c) => c.mobile === mobile);
    if (!found) throw new Error('Customer not found');
    return found;
  },
};

