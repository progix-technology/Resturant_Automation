import { API_BASE_URL, apiRequest } from './apiConfig';
import { PAYMENT_STATUS } from '../constants/paymentStatuses';
import { orderService } from './orderService';

export const paymentService = {
  /**
   * Dynamically loads the Razorpay Standard Checkout SDK
   */
  loadRazorpayScript() {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * Fetches public payment config (Razorpay Key ID & Status) for a restaurant
   */
  async getPaymentConfig(slug) {
    try {
      const res = await fetch(`${API_BASE_URL}/payment/config/${slug}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch payment config:', err);
      return { success: false, isRazorpayEnabled: false };
    }
  },

  /**
   * Creates a Razorpay Order on the backend
   */
  async createRazorpayOrder({ orderId, amount, restaurantSlug, customerName, customerMobile }) {
    return await apiRequest('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        amount,
        restaurantSlug,
        customerName,
        customerMobile,
      }),
    });
  },

  /**
   * Verifies cryptographic HMAC SHA256 signature on the backend
   */
  async verifyPayment({ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, restaurantSlug }) {
    return await apiRequest('/payment/verify', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        restaurantSlug,
      }),
    });
  },

  /**
   * Fetches payment status for order
   */
  async getPaymentStatus(orderId) {
    const order = await orderService.getOrder(orderId);
    return order.paymentStatus;
  },

  /**
   * Fallback trigger for manual payment completion
   */
  async simulatePaymentSuccess(orderId, markServed = true) {
    const updatedOrder = await orderService.updatePaymentStatus(orderId, PAYMENT_STATUS.COMPLETED, markServed);
    return updatedOrder;
  },
};
