import mongoose from 'mongoose';

const waiterCallSchema = new mongoose.Schema(
  {
    callId: {
      type: String,
      required: true,
      unique: true,
    },
    id: {
      type: String,
      required: true,
    },
    restaurantSlug: {
      type: String,
      required: true,
      default: 'spice-garden',
      index: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      default: 'Guest',
    },
    reason: {
      type: String,
      default: 'Need Waiter Service',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ATTENDED', 'RESOLVED', 'CANCELLED'],
      default: 'PENDING',
    },
    time: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
  }
);

export const WaiterCall = mongoose.model('WaiterCall', waiterCallSchema);

