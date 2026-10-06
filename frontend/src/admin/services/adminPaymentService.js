import { adminOrderService } from './adminOrderService';
import { simulateDelay } from '../../services/apiConfig';

export const adminPaymentService = {
  async getPayments() {
    await simulateDelay(200);
    const orders = await adminOrderService.getOrders();

    return orders.map((order) => ({
      paymentId: `PAY-${order.orderId.replace('ORD-', '')}`,
      orderId: order.orderId,
      customerName: order.customerName,
      tableNumber: order.tableNumber,
      amount: order.total,
      method: order.paymentMethod || 'UPI',
      status: order.paymentStatus === 'COMPLETED' ? 'SUCCESS' : order.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
      createdAt: order.createdAt,
    }));
  },

  async requestPayment(orderId, amount, customerName, tableNumber) {
    await simulateDelay(300);
    return {
      success: true,
      orderId,
      amount,
      customerName,
      tableNumber,
      qrUrl: `upi://pay?pa=spicegarden@upi&pn=Spice%20Garden&am=${amount}&tr=${orderId}`,
      paymentLink: `https://pay.spicegarden.in/bill/${orderId}`,
      requestedAt: new Date().toISOString(),
    };
  },
};
