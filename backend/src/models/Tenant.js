import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: '🍽️',
    },
    ownerName: {
      type: String,
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
    },
    ownerPhone: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    planId: {
      type: String,
      default: 'plan-growth',
    },
    planName: {
      type: String,
      default: 'Growth Pro',
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'ANNUAL'],
      default: 'MONTHLY',
    },
    planAmount: {
      type: Number,
      default: 2499,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRIAL', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    renewalDate: {
      type: String,
    },
    activeTables: {
      type: Number,
      default: 20,
    },
    monthlyOrders: {
      type: Number,
      default: 0,
    },
    monthlyGMV: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Tenant = mongoose.model('Tenant', tenantSchema);
