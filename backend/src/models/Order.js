import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  id: String,
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  isVeg: { type: Boolean, default: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    restaurantSlug: {
      type: String,
      required: true,
      default: 'spice-garden',
    },
    customerName: {
      type: String,
      default: 'Valued Guest',
    },
    mobile: {
      type: String,
      default: '',
    },
    tableNumber: {
      type: String,
      required: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    taxes: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'RECEIVED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED', 'REJECTED'],
      default: 'CONFIRMED',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'SUCCESS'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CASH', 'CARD'],
      default: 'UPI',
    },
    etaMinutes: {
      type: Number,
      default: 20,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model('Order', orderSchema);
