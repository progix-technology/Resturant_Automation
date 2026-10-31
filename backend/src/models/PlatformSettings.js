import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'Progix Technology Pvt Ltd',
    },
    brandName: {
      type: String,
      default: 'OrderFlow Multi-Tenant Cloud',
    },
    contactEmail: {
      type: String,
      default: 'progixtechnology@gmail.com',
    },
    supportPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    upiId: {
      type: String,
      default: 'progixtechnology@upi',
    },
    bankName: {
      type: String,
      default: 'HDFC Bank',
    },
    accountNumber: {
      type: String,
      default: '50200012345678',
    },
    ifscCode: {
      type: String,
      default: 'HDFC0001234',
    },
    accountHolder: {
      type: String,
      default: 'Progix Technology Pvt Ltd',
    },
    qrImageUrl: {
      type: String,
      default: '',
    },
    taxPercentage: {
      type: Number,
      default: 18,
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

