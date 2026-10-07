import mongoose from 'mongoose';

const restaurantSettingsSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      default: 'spice-garden',
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      default: 'Spice Garden',
      trim: true,
    },
    restaurantName: {
      type: String,
      trim: true,
    },
    tagline: {
      type: String,
      default: '',
      trim: true,
    },
    cuisine: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 1,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    openTime: {
      type: String,
      default: '11:30 AM',
    },
    closeTime: {
      type: String,
      default: '11:00 PM',
    },
    isKitchenOpen: {
      type: Boolean,
      default: true,
    },
    isAcceptingOrders: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    gstin: {
      type: String,
      default: '',
    },
    upiId: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    taxPercentage: {
      type: Number,
      default: 5,
    },
    defaultPreparationTimeMinutes: {
      type: Number,
      default: 25,
    },
    bankName: {
      type: String,
      default: '',
    },
    accountHolderName: {
      type: String,
      default: '',
    },
    accountNumber: {
      type: String,
      default: '',
    },
    ifscCode: {
      type: String,
      default: '',
    },
    accountType: {
      type: String,
      default: '',
    },
    branchName: {
      type: String,
      default: '',
    },
    whatsappEnabled: {
      type: Boolean,
      default: true,
    },
    whatsappPhone: {
      type: String,
      default: '9876543210',
    },
    orderAcceptAlert: {
      type: Boolean,
      default: true,
    },
    preparingAlert: {
      type: Boolean,
      default: true,
    },
    readyAlert: {
      type: Boolean,
      default: true,
    },
    servedAlert: {
      type: Boolean,
      default: true,
    },
    paymentAlert: {
      type: Boolean,
      default: true,
    },
    autoAcceptOrders: {
      type: Boolean,
      default: false,
    },
    allowCancellation: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-sync name and restaurantName
restaurantSettingsSchema.pre('save', function () {
  if (this.name && !this.restaurantName) {
    this.restaurantName = this.name;
  } else if (this.restaurantName && !this.name) {
    this.name = this.restaurantName;
  }
});


export const RestaurantSettings =
  mongoose.models.RestaurantSettings || mongoose.model('RestaurantSettings', restaurantSettingsSchema);
