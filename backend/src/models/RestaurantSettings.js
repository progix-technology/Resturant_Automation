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
      default: 'Authentic flavors, freshly prepared.',
      trim: true,
    },
    cuisine: {
      type: String,
      default: 'North Indian • Chinese • Tandoor',
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
      default: 320,
      min: 0,
    },
    address: {
      type: String,
      default: '14, Palm Grove Road, Indiranagar, Bengaluru',
      trim: true,
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
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
      default: '+91 98765 43210',
    },
    email: {
      type: String,
      default: 'contact@spicegarden.com',
    },
    gstin: {
      type: String,
      default: '29ABCDE1234F1Z5',
    },
    upiId: {
      type: String,
      default: 'spicegarden@okhdfcbank',
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
      default: 'HDFC Bank',
    },
    accountHolderName: {
      type: String,
      default: 'Spice Garden Hospitality',
    },
    accountNumber: {
      type: String,
      default: '50200084920184',
    },
    ifscCode: {
      type: String,
      default: 'HDFC0000128',
    },
    accountType: {
      type: String,
      default: 'Current Account',
    },
    branchName: {
      type: String,
      default: 'Indiranagar Branch, Bengaluru',
    },
    whatsappEnabled: {
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
