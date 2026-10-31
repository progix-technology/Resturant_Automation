import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    tableId: {
      type: String,
      required: true,
    },
    restaurantSlug: {
      type: String,
      required: true,
      default: 'spice-garden',
      index: true,
    },
    number: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      default: 4,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'],
      default: 'AVAILABLE',
    },
    section: {
      type: String,
      default: 'Main Dining',
    },
    currentOrderId: {
      type: String,
      default: null,
    },
    customerName: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      default: 0,
    },
    occupiedSince: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of table numbers within each restaurant
tableSchema.index({ restaurantSlug: 1, number: 1 }, { unique: true });

export const Table = mongoose.model('Table', tableSchema);
