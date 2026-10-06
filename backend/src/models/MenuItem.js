import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
    },
    restaurantSlug: {
      type: String,
      default: 'spice-garden',
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    categoryId: {
      type: String,
      default: 'starters',
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isSpicy: {
      type: Boolean,
      default: false,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: String,
      default: '15 mins',
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    addons: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
