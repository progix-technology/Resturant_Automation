import { adminOrderService } from './adminOrderService';
import { simulateDelay } from '../../services/apiConfig';

export const adminCustomerService = {
  /**
   * Aggregates unique guest diners from all recorded orders
   */
  async getCustomers() {
    await simulateDelay(200);
    const orders = await adminOrderService.getOrders();

    const customerMap = new Map();

    orders.forEach((order) => {
      const mobileKey = order.mobile || 'Unknown';
      if (!customerMap.has(mobileKey)) {
        customerMap.set(mobileKey, {
          id: `cust-${mobileKey}`,
          name: order.customerName || 'Guest Diner',
          mobile: order.mobile,
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: order.createdAt,
          lastTable: order.tableNumber,
          orders: [],
        });
      }

      const record = customerMap.get(mobileKey);
      record.ordersCount += 1;
      record.totalSpent += Number(order.total || 0);
      record.orders.push(order);

      // Keep latest order info
      if (new Date(order.createdAt) > new Date(record.lastOrderDate)) {
        record.lastOrderDate = order.createdAt;
        record.lastTable = order.tableNumber;
        if (order.customerName) record.name = order.customerName;
      }
    });

    return Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate)
    );
  },

  async getCustomerByMobile(mobile) {
    const customers = await this.getCustomers();
    const found = customers.find((c) => c.mobile === mobile);
    if (!found) throw new Error('Customer not found');
    return found;
  },
};
