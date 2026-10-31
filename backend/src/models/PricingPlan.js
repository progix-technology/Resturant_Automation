import mongoose from 'mongoose';

const pricingPlanSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
    },
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      default: '',
    },
    monthlyPrice: {
      type: Number,
      required: true,
    },
    annualPrice: {
      type: Number,
      required: true,
    },
    tableLimit: {
      type: Number,
      default: 20,
    },
    description: {
      type: String,
      default: '',
    },
    features: [String],
    isPopular: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: 'amber',
    },
  },
  {
    timestamps: true,
  }
);

export const PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema);

