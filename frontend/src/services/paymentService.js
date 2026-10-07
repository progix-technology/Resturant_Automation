import { simulateDelay } from './apiConfig';
import { PAYMENT_STATUS } from '../constants/paymentStatuses';
import { orderService } from './orderService';
import { notificationService } from './notificationService';

export const paymentService = {
  /**
   * Fetches payment status for order
   */
  async getPaymentStatus(orderId) {
    await simulateDelay(200);
    const order = await orderService.getOrder(orderId);
    return order.paymentStatus;
  },

  /**
   * Simulator / Real trigger for payment success (Done)
   */
  async simulatePaymentSuccess(orderId, markServed = true) {
    await simulateDelay(200);
    const updatedOrder = await orderService.updatePaymentStatus(orderId, PAYMENT_STATUS.COMPLETED, markServed);
    // Automatic WhatsApp dispatch removed as per user instruction (Admin dispatches manually)
    return updatedOrder;
  },
};
