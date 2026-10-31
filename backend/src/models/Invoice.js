import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
    },
    id: {
      type: String,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    tenantName: {
      type: String,
      default: 'Restaurant Client',
    },
    slug: {
      type: String,
      required: true,
      index: true,
    },
    planName: {
      type: String,
      default: 'Growth Pro',
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['PAID', 'PENDING', 'OVERDUE', 'CANCELLED'],
      default: 'PENDING',
    },
    billingDate: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: 'UPI / Bank Transfer',
    },
  },
  {
    timestamps: true,
  }
);

export const Invoice = mongoose.model('Invoice', invoiceSchema);
