import mongoose from 'mongoose';

const whatsAppSessionSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    files: {
      type: Map,
      of: String,
    },
    connectedPhone: {
      type: String,
      default: null,
    },
    lastConnectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const WhatsAppSession = mongoose.model('WhatsAppSession', whatsAppSessionSchema);

